// controllers/orderStatusLogController.js
const orderStatusLogModel = require('../models/orderStatusLogModel');
const orderModel = require('../models/orderModel');

/**
 * Scope check: customer sees own orders' logs;
 * vendor sees logs of orders at their stalls;
 * operator & NEAOfficer see all.
 */
async function userCanAccessOrder(user, order) {
  if (!order) return false;
  if (user.role === 'Operator' || user.role === 'NEAOfficer') return true;
  if (user.role === 'Customer') return order.CustomerId === user.id;
  if (user.role === 'Vendor') return order.OwnerId === user.id;
  return false;
}

async function getAllLogs(req, res, next) {
  try {
    if (!req.query.orderId) {
      return res.status(400).json({ success: false, message: 'orderId query parameter is required' });
    }
    const orderId = parseInt(req.query.orderId);
    const order = await orderModel.getOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!(await userCanAccessOrder(req.user, order))) {
      return res.status(403).json({ success: false, message: 'You cannot view this order\'s logs' });
    }
    const rows = await orderStatusLogModel.getAllLogs(orderId);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getLogById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await orderStatusLogModel.getLogById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Log not found' });
    const order = await orderModel.getOrderById(row.OrderId);
    if (!(await userCanAccessOrder(req.user, order))) {
      return res.status(403).json({ success: false, message: 'You cannot view this log' });
    }
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function getOrderHistory(req, res, next) {
  try {
    const orderId = parseInt(req.params.orderId);
    const order = await orderModel.getOrderById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (!(await userCanAccessOrder(req.user, order))) {
      return res.status(403).json({ success: false, message: 'You cannot view this order\'s history' });
    }
    const rows = await orderStatusLogModel.getHistoryForOrder(orderId);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function createLog(req, res, next) {
  try {
    const { orderId, status, changedBy } = req.body;
    const order = await orderModel.getOrderById(orderId);
    if (!order) return res.status(400).json({ success: false, message: 'Order not found' });

    if (req.user.role === 'Vendor' && order.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only add logs to your stall\'s orders' });
    }
    if (req.user.role === 'Customer') {
      return res.status(403).json({ success: false, message: 'Customers cannot create status logs' });
    }

    const created = await orderStatusLogModel.createLog({
      orderId, status, changedBy: changedBy || req.user.id,
    });
    res.status(201).json({ success: true, message: 'Status log created', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateLog(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const existing = await orderStatusLogModel.getLogById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Log not found' });
    const order = await orderModel.getOrderById(existing.OrderId);
    if (req.user.role === 'Vendor' && order && order.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your stall\'s logs' });
    }
    if (req.user.role === 'Customer') {
      return res.status(403).json({ success: false, message: 'Customers cannot update logs' });
    }
    const updated = await orderStatusLogModel.updateLog(id, { status });
    res.status(200).json({ success: true, message: 'Log updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteLog(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await orderStatusLogModel.getLogById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Log not found' });
    const ok = await orderStatusLogModel.deleteLog(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Log not found' });
    res.status(200).json({ success: true, message: 'Log deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllLogs,
  getLogById,
  getOrderHistory,
  createLog,
  updateLog,
  deleteLog,
};
