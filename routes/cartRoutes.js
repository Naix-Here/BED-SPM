// routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');
const { validateCartCreate, validateCheckout } = require('../middleware/validators');
const cartController = require('../controllers/cartController');

router.get('/', optionalAuth, cartController.getUserCarts);

router.get('/active', optionalAuth, cartController.getActiveCarts);

router.get('/:id', optionalAuth, cartController.getCartById);

router.post('/', optionalAuth, validateCartCreate, cartController.createCart);

router.delete('/:id', optionalAuth, cartController.deleteCart);

router.post('/checkout', verifyToken, validateCheckout, cartController.checkout);

module.exports = router;
