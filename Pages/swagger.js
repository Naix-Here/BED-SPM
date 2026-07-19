/* ==========================================================================
   swagger.js — Swagger/OpenAPI configuration for my features
   Add to start.js: app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
   Requires: npm install swagger-jsdoc swagger-ui-express
   ========================================================================== */
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HawkerHub – Order History & Vendor Management API',
      version: '1.0.0',
      description: 'RESTful API for patron order history (view, cancel, feedback, stats) and vendor management (menu CRUD, stalls, rental agreements). Built for the BED Hawker Centre Management System.',
      contact: { name: 'BED Assignment Team', email: 'team@example.com' }
    },
    servers: [{ url: 'http://localhost:3000', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Session Token' }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/orderHistoryRoutes.js', './routes/vendorManagementRoutes.js']
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
