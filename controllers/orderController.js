// controllers/orderController.js — HTTP handlers for /api/orders.
const orderModel = require('../models/orderModel');
const stallModel = require('../models/stallModel');
const { ORDER_STATUS } = require('../config/constants');

/**
 * Status transition map.
 *   Pending  -> Preparing, Cancelled
 *   Preparing-> Ready, Cancelled
 *   Ready    -> Completed, Cancelled
 *   Completed-> (none)
 *   Cancelled-> (none)
 */
const ALLOWED_TRANSITIONS = {
  Pending:   ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready:     ['Completed', 'Cancelled'],
  Completed: [],
  Cancelled: [],
};

/**
 * Return true if `from -> to` is a permitted transition.
 */
function isValidTransition(from, to) {
  if (from === to) return true;
  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

/**
 * GET /api/orders
 * Customer -> own orders; Vendor -> orders for their stalls; Operator -> all.
 */
async function getAllOrders(req, res) {
  try {
    let orders;
    if (req.user.role === 'Customer') {
      orders = await orderModel.getOrdersByCustomerId(req.user.id);
    } else if (req.user.role === 'Vendor') {
      orders = await orderModel.getOrdersByVendorStalls(req.user.id);
    } else if (req.user.role === 'Operator') {
      orders = await orderModel.getAllOrders();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Orders retrieved successfully.',
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('getAllOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve orders.', error: error.message });
  }
}

/**
 * GET /api/orders/my-orders  (Customer only)
 */
async function getMyOrders(req, res) {
  try {
    if (req.user.role !== 'Customer') {
      return res.status(403).json({ success: false, message: 'Only customers can use this endpoint.' });
    }
    const orders = await orderModel.getOrdersByCustomerId(req.user.id);
    return res.status(200).json({
      success: true,
      message: 'My orders retrieved successfully.',
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('getMyOrders error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve your orders.', error: error.message });
  }
}

/**
 * GET /api/orders/stall/:stallId  (Vendor owner or Operator)
 */
async function getOrdersByStall(req, res) {
  try {
    const stallId = parseInt(req.params.stallId, 10);
    if (Number.isNaN(stallId)) {
      return res.status(400).json({ success: false, message: 'Invalid stallId.' });
    }
    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(404).json({ success: false, message: 'Stall not found.' });
    }
    if (req.user.role === 'Vendor' && stall.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view orders for your own stall.' });
    }
    if (req.user.role !== 'Vendor' && req.user.role !== 'Operator') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const orders = await orderModel.getOrdersByStallId(stallId);
    return res.status(200).json({
      success: true,
      message: 'Stall orders retrieved successfully.',
      data: orders,
      count: orders.length,
    });
  } catch (error) {
    console.error('getOrdersByStall error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stall orders.', error: error.message });
  }
}

/**
 * GET /api/orders/:id  (scoped)
 */
async function getOrderById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id.' });
    }
    const order = await orderModel.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (req.user.role === 'Customer' && order.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view your own orders.' });
    }
    if (req.user.role === 'Vendor' && order.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view orders for your own stall.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Order retrieved successfully.',
      data: order,
    });
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve order.', error: error.message });
  }
}

/**
 * POST /api/orders
 * Customer (logged in) or guest.
 * Body:
 *   { stallId, totalAmount, specialInstructions?,
 *     customerId?, guestName?, items?: [{ menuItemId, quantity, addOns?, addOnCharge? }] }
 * When `items` is supplied, order items are created in the same request.
 */
async function createOrder(req, res) {
  try {
    const { stallId, totalAmount, specialInstructions, customerId, guestName, items } = req.body;
    if (!stallId || totalAmount === undefined) {
      return res.status(400).json({ success: false, message: 'stallId and totalAmount are required.' });
    }
    const total = Number(totalAmount);
    if (!Number.isFinite(total) || total <= 0) {
      return res.status(400).json({ success: false, message: 'totalAmount must be a positive number.' });
    }
    if (specialInstructions && specialInstructions.length > 500) {
      return res.status(400).json({ success: false, message: 'specialInstructions must be <= 500 characters.' });
    }

    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(400).json({ success: false, message: 'Stall does not exist.' });
    }

    let resolvedCustomerId = null;
    let resolvedGuestName = null;
    if (req.user && req.user.role === 'Customer') {
      resolvedCustomerId = req.user.id;
    } else if (customerId) {
      if (req.user && req.user.id !== Number(customerId)) {
        return res.status(403).json({ success: false, message: 'You can only place orders for yourself.' });
      }
      resolvedCustomerId = Number(customerId);
    } else if (guestName) {
      resolvedGuestName = String(guestName).trim();
      if (!resolvedGuestName) {
        return res.status(400).json({ success: false, message: 'guestName cannot be empty for guest orders.' });
      }
    } else {
      return res.status(400).json({ success: false, message: 'Either authenticated Customer or guestName is required.' });
    }

    const order = await orderModel.createOrder({
      stallId,
      customerId: resolvedCustomerId,
      guestName: resolvedGuestName,
      totalAmount: total,
      specialInstructions,
      status: 'Pending',
      paymentStatus: 'Paid',
    });

    if (Array.isArray(items) && items.length) {
      const orderItemModel = require('../models/orderItemModel');
      for (const it of items) {
        if (!it.menuItemId || !it.quantity) continue;
        const menuItemModel = require('../models/menuItemModel');
        const menu = await menuItemModel.getMenuItemById(Number(it.menuItemId));
        if (!menu) continue;
        if (menu.StallId !== order.StallId) {
          continue;
        }
        const unitPrice = Number(menu.Price);
        await orderItemModel.createOrderItem({
          orderId: order.OrderId,
          menuItemId: Number(it.menuItemId),
          quantity: Number(it.quantity),
          unitPrice,
          addOns: it.addOns || null,
          addOnCharge: it.addOnCharge ? Number(it.addOnCharge) : 0,
        });
      }
    }

    const fullOrder = await orderModel.getOrderById(order.OrderId);
    return res.status(201).json({
      success: true,
      message: 'Order created successfully.',
      data: fullOrder,
    });
  } catch (error) {
    console.error('createOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create order.', error: error.message });
  }
}

/**
 * PUT /api/orders/:id
 * Body: { status?, specialInstructions? }
 * Status transitions enforced by role.
 */
async function updateOrder(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id.' });
    }
    const existing = await orderModel.getOrderById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const { status, specialInstructions } = req.body;
    let result = existing;

    const isCustomer = req.user.role === 'Customer';
    const isVendor = req.user.role === 'Vendor';
    const isOperator = req.user.role === 'Operator';

    if (isCustomer && existing.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify your own orders.' });
    }
    if (isVendor && existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only modify orders for your own stall.' });
    }

    if (specialInstructions !== undefined) {
      if (specialInstructions && specialInstructions.length > 500) {
        return res.status(400).json({ success: false, message: 'specialInstructions must be <= 500 characters.' });
      }
      if (isCustomer && existing.Status !== 'Pending') {
        return res.status(403).json({ success: false, message: 'Cannot change instructions after preparation has started.' });
      }
      result = await orderModel.updateOrderInstructions(id, specialInstructions);
    }

    if (status && status !== existing.Status) {
      if (!ORDER_STATUS.includes(status)) {
        return res.status(400).json({ success: false, message: `status must be one of: ${ORDER_STATUS.join(', ')}.` });
      }
      if (!isValidTransition(existing.Status, status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status transition from '${existing.Status}' to '${status}'.`,
        });
      }
      if (isCustomer) {
        if (status !== 'Cancelled' || existing.Status !== 'Pending') {
          return res.status(403).json({ success: false, message: 'Customers can only cancel pending orders.' });
        }
      } else if (isVendor) {
        if (!['Preparing', 'Ready', 'Completed', 'Cancelled'].includes(status)) {
          return res.status(403).json({ success: false, message: 'Vendors cannot set this status.' });
        }
      }

      result = await orderModel.updateOrderStatus(id, status);

      try {
        const orderStatusLogModel = require('../models/orderStatusLogModel');
        if (orderStatusLogModel && typeof orderStatusLogModel.createLog === 'function') {
          await orderStatusLogModel.createLog({
            orderId: id,
            status,
            changedBy: req.user.id,
          });
        }
      } catch (e) {
        console.warn('orderStatusLogModel.createLog unavailable:', e.message);
      }

      if (result.CustomerId) {
        try {
          const notificationModel = require('../models/notificationModel');
          if (notificationModel && typeof notificationModel.createNotification === 'function') {
            await notificationModel.createNotification({
              userId: result.CustomerId,
              title: 'Order Updated',
              message: `Your order #${id} is now ${status}.`,
              type: 'Order',
            });
          }
        } catch (e) {
          console.warn('notificationModel.createNotification unavailable:', e.message);
        }
      }
    }

    const fresh = await orderModel.getOrderById(id);
    return res.status(200).json({
      success: true,
      message: 'Order updated successfully.',
      data: fresh,
    });
  } catch (error) {
    console.error('updateOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update order.', error: error.message });
  }
}

/**
 * DELETE /api/orders/:id
 * Customer (owner) or Operator.
 */
async function deleteOrder(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid order id.' });
    }
    const existing = await orderModel.getOrderById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (req.user.role === 'Customer' && existing.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own orders.' });
    }
    if (req.user.role === 'Vendor') {
      return res.status(403).json({ success: false, message: 'Vendors cannot delete orders; use status update to cancel.' });
    }
    const ok = await orderModel.deleteOrder(id);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Failed to delete order.' });
    }
    return res.status(200).json({ success: true, message: 'Order deleted successfully.' });
  } catch (error) {
    console.error('deleteOrder error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete order.', error: error.message });
  }
}

module.exports = {
  getAllOrders,
  getMyOrders,
  getOrdersByStall,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  isValidTransition,
  ALLOWED_TRANSITIONS,
};
