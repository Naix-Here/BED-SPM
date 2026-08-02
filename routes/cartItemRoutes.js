// routes/cartItemRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { validateCartItem } = require('../middleware/validators');
const cartItemController = require('../controllers/cartItemController');

router.get('/', verifyToken, cartItemController.getAllCartItems);

router.get('/:id', verifyToken, cartItemController.getCartItemById);

router.post('/', verifyToken, validateCartItem, cartItemController.createCartItem);

router.put('/:id', verifyToken, cartItemController.updateCartItem);

router.delete('/:id', verifyToken, cartItemController.deleteCartItem);

module.exports = router;
