// routes/orderItemRoutes.js — /api/order-items
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const controller = require('../controllers/orderItemController');

router.get('/', verifyToken, controller.getAllOrderItems);
router.post('/', verifyToken, controller.createOrderItem);

router.get('/:id', verifyToken, controller.getOrderItemById);
router.put('/:id', verifyToken, controller.updateOrderItem);
router.delete('/:id', verifyToken, controller.deleteOrderItem);

module.exports = router;
