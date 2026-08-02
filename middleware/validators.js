// middleware/validators.js — Express-validator chains.
// Each chain can be passed directly to a route, e.g. validateRegister.

const { body, param, validationResult } = require('express-validator');
const { ROLES } = require('../config/constants');

/**
 * Helper: run validation result and return 400 if any errors.
 */
function runValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.path || e.param,
        message: e.msg,
      })),
    });
  }
  next();
}

// ============================================================
// Auth validators
// ============================================================

const validateRegister = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Email must be a valid email address.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long.')
    .matches(/[A-Za-z]/)
    .withMessage('Password must contain at least one letter.')
    .matches(/\d/)
    .withMessage('Password must contain at least one number.'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 1, max: 100 })
    .withMessage('Full name must be between 1 and 100 characters.'),
  body('role')
    .notEmpty()
    .withMessage('Role is required.')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}.`),
  runValidation,
];

const validateLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Email must be a valid email address.')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
  runValidation,
];

const validateChangePassword = [
  body('oldPassword').notEmpty().withMessage('Old password is required.'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required.')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long.')
    .matches(/[A-Za-z]/)
    .withMessage('New password must contain at least one letter.')
    .matches(/\d/)
    .withMessage('New password must contain at least one number.'),
  runValidation,
];

// ============================================================
// Member 1 — Feedback, Likes, Complaint, Inspection, HygieneGrade, Promotion, Queue
// ============================================================

const validateFeedback = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage('Comment must not exceed 1000 characters'),
  runValidation,
];

const validateLike = [
  body('menuItemId').isInt({ min: 1 }).withMessage('Valid menu item ID is required'),
  runValidation,
];

const validateComplaint = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  body('subject').isLength({ min: 1, max: 200 }).withMessage('Subject is required (max 200 characters)'),
  body('description').isLength({ min: 1, max: 2000 }).withMessage('Description is required (max 2000 characters)'),
  runValidation,
];

const validateComplaintStatus = [
  body('status').isIn(['Open', 'Investigating', 'Resolved']).withMessage('Status must be Open, Investigating, or Resolved'),
  runValidation,
];

const validateInspection = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  body('inspectionDate').isISO8601().withMessage('Valid inspection date is required'),
  body('score').isFloat({ min: 0, max: 100 }).withMessage('Score must be between 0 and 100'),
  body('gradeIssued').isIn(['A', 'B', 'C', 'D']).withMessage('Grade issued must be A, B, C, or D'),
  body('remarks').optional({ checkFalsy: true }).isLength({ max: 2000 }).withMessage('Remarks must not exceed 2000 characters'),
  runValidation,
];

const validateHygieneGrade = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  body('grade').isIn(['A', 'B', 'C', 'D']).withMessage('Grade must be A, B, C, or D'),
  body('issuedDate').isISO8601().withMessage('Valid issued date is required'),
  body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
  body('inspectionId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Inspection id must be a positive integer'),
  runValidation,
];

const validatePromotion = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('description').optional({ checkFalsy: true }).isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
  body('discountType').isIn(['Percentage', 'Fixed', 'Points', 'Delivery']).withMessage('Valid discount type is required'),
  body('discountValue').isFloat({ min: 0 }).withMessage('Discount value must be a positive number'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required').custom((value, { req }) => {
    if (!req.body.startDate) return true;
    if (new Date(value) <= new Date(req.body.startDate)) {
      throw new Error('End date must be after start date');
    }
    return true;
  }),
  runValidation,
];

const validateJoinQueue = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  runValidation,
];

const validateQueueStatus = [
  body('status').isIn(['Waiting', 'Served', 'Cancelled']).withMessage('Status must be Waiting, Served, or Cancelled'),
  runValidation,
];

// ============================================================
// Member 3 — Cart, CartItem, CustomerProfile, VendorProfile, OrderStatusLog
// ============================================================

const validateCustomerProfile = [
  body('phone').optional({ checkFalsy: true }).isLength({ max: 20 }).withMessage('Phone must be at most 20 characters'),
  body('preferredLanguage').optional({ checkFalsy: true }).isIn(['en', 'zh', 'ms', 'ta']).withMessage('Preferred language must be en, zh, ms, or ta'),
  body('loyaltyPoints').optional({ checkFalsy: true }).isInt({ min: 0 }).withMessage('Loyalty points must be a non-negative integer'),
  runValidation,
];

const validateVendorProfile = [
  body('businessName').optional({ checkFalsy: true }).isLength({ max: 100 }).withMessage('Business name must be at most 100 characters'),
  body('contactNumber').optional({ checkFalsy: true }).isLength({ max: 20 }).withMessage('Contact number must be at most 20 characters'),
  body('stallId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Stall id must be a positive integer'),
  runValidation,
];

const validateCartCreate = [
  body('stallId').isInt({ min: 1 }).withMessage('Valid stall ID is required'),
  runValidation,
];

const validateCartItem = [
  body('cartId').isInt({ min: 1 }).withMessage('Valid cart ID is required'),
  body('menuItemId').isInt({ min: 1 }).withMessage('Valid menu item ID is required'),
  body('quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('addOns').optional({ checkFalsy: true }).isString().isLength({ max: 500 }).withMessage('Add-ons must be at most 500 characters'),
  body('addOnCharge').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Add-on charge must be a non-negative number'),
  runValidation,
];

const validateCheckout = [
  body('cartIds').isArray({ min: 1 }).withMessage('cartIds must be a non-empty array'),
  body('cartIds.*').isInt({ min: 1 }).withMessage('Each cart id must be a positive integer'),
  body('guestName').optional({ checkFalsy: true }).isLength({ max: 100 }).withMessage('Guest name must be at most 100 characters'),
  runValidation,
];

const validateOrderStatusLog = [
  body('orderId').isInt({ min: 1 }).withMessage('Valid order ID is required'),
  body('status').isIn(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']).withMessage('Valid status is required'),
  body('changedBy').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('changedBy must be a positive integer'),
  runValidation,
];

const validateOrderStatus = [
  body('status').isIn(['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled']).withMessage('Valid status is required'),
  runValidation,
];

const validateNotification = [
  body('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
  body('title').isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 characters)'),
  body('message').isLength({ min: 1, max: 1000 }).withMessage('Message is required (max 1000 characters)'),
  body('type').isLength({ min: 1, max: 50 }).withMessage('Type is required (max 50 characters)'),
  runValidation,
];

// ============================================================
// Stubs for additional validators (parallel agents may fill in)
// ============================================================

const validateStall = [
  body('hawkerCentreId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('hawkerCentreId must be a positive integer.'),
  body('ownerId').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('ownerId must be a positive integer.'),
  body('name').optional({ checkFalsy: true }).isString().isLength({ min: 1, max: 100 }).withMessage('name must be 1-100 characters.'),
  body('description').optional({ checkFalsy: true }).isString().isLength({ max: 500 }).withMessage('description must be <= 500 characters.'),
  body('unitNumber').optional({ checkFalsy: true }).isString().isLength({ min: 1, max: 20 }).withMessage('unitNumber must be 1-20 characters.'),
  body('imageUrl')
    .optional({ checkFalsy: true })
    .isString()
    .isLength({ max: 500 })
    .withMessage('imageUrl must be at most 500 characters.')
    .custom((value) => {
      try {
        const u = new URL(value);
        if (!['http:', 'https:'].includes(u.protocol)) {
          throw new Error('imageUrl must use http or https.');
        }
        return true;
      } catch {
        throw new Error('imageUrl must be a valid http(s) URL.');
      }
    }),
  body('status').optional({ checkFalsy: true }).isString().withMessage('status must be a string.'),
  runValidation,
];

const validateMenuItem = (req, res, next) => next();
const validateOrder = (req, res, next) => next();
const validateRentalAgreement = (req, res, next) => next();

module.exports = {
  validateRegister,
  validateLogin,
  validateChangePassword,
  validateStall,
  validateMenuItem,
  validateOrder,
  validateFeedback,
  validateLike,
  validateComplaint,
  validateComplaintStatus,
  validateInspection,
  validateHygieneGrade,
  validatePromotion,
  validateJoinQueue,
  validateQueueStatus,
  validateCustomerProfile,
  validateVendorProfile,
  validateCartCreate,
  validateCartItem,
  validateCheckout,
  validateOrderStatusLog,
  validateOrderStatus,
  validateNotification,
  validateRentalAgreement,
  validateCart: validateCartCreate,
  runValidation,
};
