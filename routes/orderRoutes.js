// routes/orderRoutes.js — /api/orders
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const controller = require('../controllers/orderController');

router.get('/', verifyToken, controller.getAllOrders);
router.post('/', verifyToken, controller.createOrder);

router.get('/my-orders', verifyToken, checkRole('Customer'), controller.getMyOrders);

router.get('/stall/:stallId', verifyToken, checkRole('Vendor', 'Operator'), controller.getOrdersByStall);

router.get('/:id', verifyToken, controller.getOrderById);
router.put('/:id', verifyToken, controller.updateOrder);
router.delete('/:id', verifyToken, controller.deleteOrder);

module.exports = router;
