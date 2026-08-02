// Builds the OpenAPI document from the route modules so the published API list
// stays aligned with the Express routes.
const fs = require('fs');
const path = require('path');

const requestSchemas = {
  validateRegister: { type: 'object', required: ['email', 'password', 'fullName', 'role'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password', minLength: 8 }, fullName: { type: 'string', maxLength: 100 }, role: { type: 'string', enum: ['Customer', 'Vendor', 'Operator', 'NEAOfficer'] } } },
  validateLogin: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } },
  validateChangePassword: { type: 'object', required: ['oldPassword', 'newPassword'], properties: { oldPassword: { type: 'string', format: 'password' }, newPassword: { type: 'string', format: 'password', minLength: 8 } } },
  validateFeedback: { type: 'object', required: ['stallId', 'rating'], properties: { stallId: { type: 'integer', minimum: 1 }, rating: { type: 'integer', minimum: 1, maximum: 5 }, comment: { type: 'string', maxLength: 1000 } } },
  validateLike: { type: 'object', required: ['menuItemId'], properties: { menuItemId: { type: 'integer', minimum: 1 } } },
  validateComplaint: { type: 'object', required: ['stallId', 'subject', 'description'], properties: { stallId: { type: 'integer', minimum: 1 }, subject: { type: 'string', maxLength: 200 }, description: { type: 'string', maxLength: 2000 } } },
  validateComplaintStatus: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Open', 'Investigating', 'Resolved'] } } },
  validateInspection: { type: 'object', required: ['stallId', 'inspectionDate', 'score', 'gradeIssued'], properties: { stallId: { type: 'integer', minimum: 1 }, inspectionDate: { type: 'string', format: 'date' }, score: { type: 'number', minimum: 0, maximum: 100 }, gradeIssued: { type: 'string', enum: ['A', 'B', 'C', 'D'] }, remarks: { type: 'string', maxLength: 2000 } } },
  validateHygieneGrade: { type: 'object', required: ['stallId', 'grade', 'issuedDate', 'expiryDate'], properties: { stallId: { type: 'integer', minimum: 1 }, grade: { type: 'string', enum: ['A', 'B', 'C', 'D'] }, issuedDate: { type: 'string', format: 'date' }, expiryDate: { type: 'string', format: 'date' }, inspectionId: { type: 'integer', minimum: 1 } } },
  validatePromotion: { type: 'object', required: ['stallId', 'title', 'discountType', 'discountValue', 'startDate', 'endDate'], properties: { stallId: { type: 'integer', minimum: 1 }, title: { type: 'string', maxLength: 200 }, description: { type: 'string', maxLength: 1000 }, discountType: { type: 'string', enum: ['Percentage', 'Fixed', 'Points', 'Delivery'] }, discountValue: { type: 'number', minimum: 0 }, startDate: { type: 'string', format: 'date-time' }, endDate: { type: 'string', format: 'date-time' } } },
  validateJoinQueue: { type: 'object', required: ['stallId'], properties: { stallId: { type: 'integer', minimum: 1 } } },
  validateQueueStatus: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Waiting', 'Served', 'Cancelled'] } } },
  validateCustomerProfile: { type: 'object', properties: { phone: { type: 'string', maxLength: 20 }, preferredLanguage: { type: 'string', enum: ['en', 'zh', 'ms', 'ta'] }, loyaltyPoints: { type: 'integer', minimum: 0 } } },
  validateVendorProfile: { type: 'object', properties: { businessName: { type: 'string', maxLength: 100 }, contactNumber: { type: 'string', maxLength: 20 }, stallId: { type: 'integer', minimum: 1 } } },
  validateCartCreate: { type: 'object', required: ['stallId'], properties: { stallId: { type: 'integer', minimum: 1 } } },
  validateCartItem: { type: 'object', required: ['cartId', 'menuItemId', 'quantity'], properties: { cartId: { type: 'integer', minimum: 1 }, menuItemId: { type: 'integer', minimum: 1 }, quantity: { type: 'integer', minimum: 1 }, addOns: { type: 'string', maxLength: 500 }, addOnCharge: { type: 'number', minimum: 0 } } },
  validateCheckout: { type: 'object', required: ['cartIds'], properties: { cartIds: { type: 'array', minItems: 1, items: { type: 'integer', minimum: 1 } }, guestName: { type: 'string', maxLength: 100 } } },
  validateOrderStatusLog: { type: 'object', required: ['orderId', 'status'], properties: { orderId: { type: 'integer', minimum: 1 }, status: { type: 'string', enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'] }, changedBy: { type: 'integer', minimum: 1 } } },
  validateOrderStatus: { type: 'object', required: ['status'], properties: { status: { type: 'string', enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'] } } },
  validateNotification: { type: 'object', required: ['userId', 'title', 'message', 'type'], properties: { userId: { type: 'integer', minimum: 1 }, title: { type: 'string', maxLength: 200 }, message: { type: 'string', maxLength: 1000 }, type: { type: 'string', maxLength: 50 } } },
};

const genericPayload = { type: 'object', description: 'JSON payload accepted by this endpoint. Refer to the resource fields returned by the API.' };
const routeMounts = {
  authRoutes: 'auth', feedbackRoutes: 'feedback', likesRoutes: 'likes', complaintRoutes: 'complaints', queueRoutes: 'queue', notificationRoutes: 'notifications', inspectionRoutes: 'inspections', hygieneGradeRoutes: 'hygiene-grades', promotionRoutes: 'promotions', stallRoutes: 'stalls', menuItemRoutes: 'menu-items', menuItemCuisineRoutes: 'menu-item-cuisines', rentalAgreementRoutes: 'rental-agreements', orderRoutes: 'orders', orderItemRoutes: 'order-items', customerProfileRoutes: 'customer-profile', vendorProfileRoutes: 'vendor-profile', cartRoutes: 'cart', cartItemRoutes: 'cart-items', orderStatusLogRoutes: 'order-status-logs',
};

function buildOpenApi() {
  const paths = {};
  const routesDir = path.join(__dirname, '..', 'routes');

  for (const [file, mount] of Object.entries(routeMounts)) {
    const source = fs.readFileSync(path.join(routesDir, `${file}.js`), 'utf8');
    const matches = source.matchAll(/router\.(get|post|put|delete)\('([^']+)',\s*(.+)\);/g);
    for (const match of matches) {
      const [, method, routePath, handlers] = match;
      const apiPath = (`/api/${mount}${routePath === '/' ? '' : routePath}`).replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const controller = (handlers.match(/\.([A-Za-z0-9_]+)\s*$/) || [])[1] || 'operation';
      const tag = mount.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
      const operation = {
        tags: [tag],
        summary: controller.replace(/([A-Z])/g, ' $1').replace(/^./, (char) => char.toUpperCase()),
        responses: {
          200: { description: 'Successful response', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiResponse' } } } },
          400: { $ref: '#/components/responses/ValidationError' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      };
      const parameters = [...apiPath.matchAll(/\{([^}]+)\}/g)].map((item) => ({ name: item[1], in: 'path', required: true, schema: { type: 'integer', minimum: 1 } }));
      if (parameters.length) operation.parameters = parameters;
      if (handlers.includes('verifyToken')) operation.security = [{ bearerAuth: [] }];
      if (handlers.includes('optionalAuth')) operation.description = 'Authentication is optional. Guests may need to supply `x-session-id` where applicable.';
      const roles = [...handlers.matchAll(/checkRole\(([^)]+)\)/g)].flatMap((item) => [...item[1].matchAll(/'([^']+)'/g)].map((role) => role[1]));
      if (roles.length) operation.description = `${operation.description ? `${operation.description}\n\n` : ''}Required role: ${roles.join(' or ')}.`;
      if (['post', 'put'].includes(method)) {
        const validator = Object.keys(requestSchemas).find((key) => handlers.includes(key));
        operation.requestBody = { required: true, content: { 'application/json': { schema: requestSchemas[validator] || genericPayload } } };
      }
      paths[apiPath] ||= {};
      paths[apiPath][method] = operation;
    }
  }

  return {
    openapi: '3.0.3',
    info: { title: 'Hawker Centre Management API', version: '1.0.0', description: 'Interactive documentation for all API routes exposed by this service.' },
    servers: [{ url: 'http://localhost:{port}', variables: { port: { default: String(process.env.PORT || 3000) } } }],
    paths,
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Use the token returned by `/api/auth/login`.' } },
      schemas: {
        ApiResponse: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' }, data: {} } },
        ErrorResponse: { type: 'object', required: ['success', 'message'], properties: { success: { type: 'boolean', example: false }, message: { type: 'string' }, errors: { type: 'array', items: { type: 'object' } } } },
      },
      responses: {
        ValidationError: { description: 'Request validation failed', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Unauthorized: { description: 'Missing, invalid, or expired token', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        NotFound: { description: 'Resource or route was not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
  };
}

module.exports = buildOpenApi;
