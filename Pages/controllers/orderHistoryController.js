// controllers/orderHistoryController.js — Order history endpoints
const AppError = require('../utils/AppError');
const OrderHistory = require('../models/orderHistoryModel');

async function getMyOrders(req, res, next) {
  try {
    const result = await OrderHistory.findByUserId(req.user.id, {
      page: parseInt(req.query.page) || 1, limit: Math.min(parseInt(req.query.limit) || 10, 50),
      status: req.query.status || null, sortBy: req.query.sortBy || 'OrderDate', order: req.query.order || 'DESC'
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getGuestOrders(req, res, next) {
  try {
    const sessionId = req.headers['x-guest-session-id'] || req.query.session_id;
    if (!sessionId) throw new AppError('Guest session ID is required (x-guest-session-id header or ?session_id=).', 400);
    const orders = await OrderHistory.findByGuestSession(sessionId);
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try {
    const id = parseInt(req.params.orderId);
    if (isNaN(id)) throw new AppError('Invalid order ID.', 400);
    const order = await OrderHistory.findById(id);
    if (!order) throw new AppError('Order not found.', 404);
    if (req.user && order.UserId && order.UserId !== req.user.id) throw new AppError('Access denied. This is not your order.', 403);
    res.json({ success: true, data: order });
  } catch (err) { next(err); }
}

async function cancelOrder(req, res, next) {
  try {
    const id = parseInt(req.params.orderId);
    if (isNaN(id)) throw new AppError('Invalid order ID.', 400);
    const result = await OrderHistory.cancelOrder(id, req.user.id);
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
}

async function submitFeedback(req, res, next) {
  try {
    const orderId = parseInt(req.params.orderId);
    if (isNaN(orderId)) throw new AppError('Invalid order ID.', 400);
    const { rating, comment } = req.body;
    if (!rating || !Number.isInteger(rating) || rating < 1 || rating > 5) throw new AppError('Rating must be an integer between 1 and 5.', 400);
    const feedback = await OrderHistory.submitFeedback(orderId, req.user.id, { rating, comment });
    res.status(feedback.created ? 201 : 200).json({ success: true, message: feedback.created ? 'Feedback submitted.' : 'Feedback updated.', data: feedback });
  } catch (err) { next(err); }
}

async function getOrderStats(req, res, next) {
  try {
    res.json({ success: true, data: await OrderHistory.getUserStats(req.user.id) });
  } catch (err) { next(err); }
}

module.exports = { getMyOrders, getGuestOrders, getOrderById, cancelOrder, submitFeedback, getOrderStats };
