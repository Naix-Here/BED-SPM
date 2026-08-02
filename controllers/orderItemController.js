// controllers/orderItemController.js — HTTP handlers for /api/order-items.
const orderItemModel = require('../models/orderItemModel');
const orderModel = require('../models/orderModel');
const menuItemModel = require('../models/menuItemModel');
const stallModel = require('../models/stallModel');

/**
 * GET /api/order-items  (scoped, ?orderId=)
 */
async function getAllOrderItems(req, res) {
  try {
    const orderId = req.query.orderId ? parseInt(req.query.orderId, 10) : null;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'orderId query parameter is required.' });
    }
    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (req.user.role === 'Customer' && order.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.user.role === 'Vendor' && order.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const items = await orderItemModel.getAllOrderItems(orderId);
    return res.status(200).json({
      success: true,
      message: 'Order items retrieved successfully.',
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('getAllOrderItems error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order items.', error: error.message });
  }
}

/**
 * GET /api/order-items/:id  (scoped)
 */
async function getOrderItemById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const item = await orderItemModel.getOrderItemById(id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }
    const order = await orderModel.getOrderById(item.OrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Parent order not found.' });
    }
    if (req.user.role === 'Customer' && order.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (req.user.role === 'Vendor' && order.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Order item retrieved successfully.',
      data: item,
    });
  } catch (error) {
    console.error('getOrderItemById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order item.', error: error.message });
  }
}

/**
 * POST /api/order-items  (Customer owner or guest order)
 * Body: { orderId, menuItemId, quantity, addOns?, addOnCharge? }
 * Items can only be added while the order is Pending.
 */
async function createOrderItem(req, res) {
  try {
    const { orderId, menuItemId, quantity, addOns, addOnCharge } = req.body;
    if (!orderId || !menuItemId || !quantity) {
      return res.status(400).json({ success: false, message: 'orderId, menuItemId, and quantity are required.' });
    }
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer.' });
    }
    if (addOns && String(addOns).length > 500) {
      return res.status(400).json({ success: false, message: 'addOns must be <= 500 characters.' });
    }
    if (addOnCharge !== undefined && Number(addOnCharge) < 0) {
      return res.status(400).json({ success: false, message: 'addOnCharge cannot be negative.' });
    }

    const order = await orderModel.getOrderById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.Status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Items can only be added while the order is Pending.' });
    }
    if (req.user.role === 'Customer' && order.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify your own orders.' });
    }
    if (req.user.role === 'Vendor' && order.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const menu = await menuItemModel.getMenuItemById(menuItemId);
    if (!menu) {
      return res.status(400).json({ success: false, message: 'Menu item does not exist.' });
    }
    if (!menu.IsAvailable) {
      return res.status(400).json({ success: false, message: 'Menu item is not available.' });
    }
    if (menu.StallId !== order.StallId) {
      return res.status(400).json({ success: false, message: 'Menu item does not belong to the order\'s stall.' });
    }

    const created = await orderItemModel.createOrderItem({
      orderId,
      menuItemId,
      quantity: qty,
      unitPrice: Number(menu.Price),
      addOns: addOns || null,
      addOnCharge: addOnCharge !== undefined ? Number(addOnCharge) : 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Order item added successfully.',
      data: created,
    });
  } catch (error) {
    console.error('createOrderItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order item.', error: error.message });
  }
}

/**
 * PUT /api/order-items/:id  (Customer owner only — items only modifiable while Pending)
 */
async function updateOrderItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const existing = await orderItemModel.getOrderItemById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }
    const order = await orderModel.getOrderById(existing.OrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Parent order not found.' });
    }
    if (order.Status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Items can only be modified while the order is Pending.' });
    }
    if (req.user.role === 'Customer' && order.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify your own order items.' });
    }
    if (req.user.role === 'Vendor') {
      return res.status(403).json({ success: false, message: 'Vendors cannot modify order items.' });
    }

    const { quantity, addOns, addOnCharge } = req.body;
    if (quantity === undefined) {
      return res.status(400).json({ success: false, message: 'quantity is required.' });
    }
    const qty = parseInt(quantity, 10);
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'quantity must be a positive integer.' });
    }
    if (addOns && String(addOns).length > 500) {
      return res.status(400).json({ success: false, message: 'addOns must be <= 500 characters.' });
    }
    if (addOnCharge !== undefined && Number(addOnCharge) < 0) {
      return res.status(400).json({ success: false, message: 'addOnCharge cannot be negative.' });
    }

    const updated = await orderItemModel.updateOrderItem(id, {
      quantity: qty,
      addOns: addOns || null,
      addOnCharge: addOnCharge !== undefined ? Number(addOnCharge) : 0,
    });
    return res.status(200).json({
      success: true,
      message: 'Order item updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('updateOrderItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order item.', error: error.message });
  }
}

/**
 * DELETE /api/order-items/:id  (Customer owner only — items only removable while Pending)
 */
async function deleteOrderItem(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const existing = await orderItemModel.getOrderItemById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order item not found.' });
    }
    const order = await orderModel.getOrderById(existing.OrderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Parent order not found.' });
    }
    if (order.Status !== 'Pending') {
      return res.status(400).json({ success: false, message: 'Items can only be removed while the order is Pending.' });
    }
    if (req.user.role === 'Customer' && order.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify your own order items.' });
    }
    if (req.user.role === 'Vendor') {
      return res.status(403).json({ success: false, message: 'Vendors cannot remove order items.' });
    }
    const ok = await orderItemModel.deleteOrderItem(id);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Failed to delete order item.' });
    }
    return res.status(200).json({ success: true, message: 'Order item removed successfully.' });
  } catch (error) {
    console.error('deleteOrderItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete order item.', error: error.message });
  }
}

module.exports = {
  getAllOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
