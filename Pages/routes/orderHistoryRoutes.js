// routes/orderHistoryRoutes.js — Order history routes
const router = require('express').Router(); const ctrl = require('../controllers/orderHistoryController'); const { requireLogin } = require('../middleware/authMiddleware');
router.get('/my-orders', requireLogin, ctrl.getMyOrders);
router.get('/stats', requireLogin, ctrl.getOrderStats);
router.get('/guest', ctrl.getGuestOrders);
router.delete('/:orderId', requireLogin, ctrl.cancelOrder);
router.post('/:orderId/feedback', requireLogin, ctrl.submitFeedback);
router.get('/:orderId', requireLogin, ctrl.getOrderById);
module.exports = router;
