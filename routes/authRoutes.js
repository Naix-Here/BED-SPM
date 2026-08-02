// routes/authRoutes.js — Auth endpoints.
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const verifyToken = require('../middleware/verifyToken');
const {
  validateRegister,
  validateLogin,
  validateChangePassword,
} = require('../middleware/validators');
const { body } = require('express-validator');
const { runValidation } = require('../middleware/validators');

router.post('/register', validateRegister, authController.register);

router.post('/login', validateLogin, authController.login);

router.get('/google', authController.beginGoogleLogin);
router.get('/google/callback', authController.googleCallback);
router.post('/google/complete', [body('registration').isString().notEmpty(), body('role').isIn(['Customer', 'Vendor']), runValidation], authController.completeGoogleRegistration);
router.post('/password-reset/request', [body('email').trim().isEmail().normalizeEmail(), runValidation], authController.requestPasswordReset);
router.post('/password-reset/confirm', [body('token').isString().notEmpty(), body('password').isLength({ min: 8 }).matches(/[A-Za-z]/).matches(/\d/), runValidation], authController.resetPassword);

router.get('/me', verifyToken, authController.me);

router.put('/password', verifyToken, validateChangePassword, authController.changePassword);

module.exports = router;
