// routes/orderStatusLogRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateOrderStatusLog, validateOrderStatus } = require('../middleware/validators');
const orderStatusLogController = require('../controllers/orderStatusLogController');

router.get('/', verifyToken, orderStatusLogController.getAllLogs);

router.get('/order/:orderId', verifyToken, orderStatusLogController.getOrderHistory);

router.get('/:id', verifyToken, orderStatusLogController.getLogById);

router.post('/', verifyToken, checkRole('Vendor', 'Operator', 'NEAOfficer'), validateOrderStatusLog, orderStatusLogController.createLog);

router.put('/:id', verifyToken, checkRole('Vendor', 'Operator'), validateOrderStatus, orderStatusLogController.updateLog);

router.delete('/:id', verifyToken, checkRole('Operator'), orderStatusLogController.deleteLog);

module.exports = router;
