const cartModel = require('../models/cartModel');
const cartItemModel = require('../models/cartItemModel');
const orderModel = require('../models/orderModel');
const orderItemModel = require('../models/orderItemModel');
const menuItemModel = require('../models/menuItemModel');
const stallModel = require('../models/stallModel');
const notificationModel = require('../models/notificationModel');
const orderStatusLogModel = require('../models/orderStatusLogModel');

/**
 * Determine a session id from header or body.
 */
function getSessionId(req) {
  return req.headers['x-session-id'] || (req.body && req.body.sessionId) || null;
}

async function getUserCarts(req, res, next) {
  try {
    const customerId = req.user ? req.user.id : null;
    const sessionId = getSessionId(req) || req.query.sessionId;
    if (!customerId && !sessionId) {
      return res.status(200).json({ success: true, data: [], count: 0, message: 'Provide x-session-id header for guest carts' });
    }
    const rows = await cartModel.getCartsForUserOrSession(customerId, sessionId);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getActiveCarts(req, res, next) {
  try {
    const customerId = req.user ? req.user.id : null;
    const sessionId = getSessionId(req) || req.query.sessionId;
    if (!customerId && !sessionId) {
      return res.status(200).json({ success: true, data: [], count: 0 });
    }
    const rows = await cartModel.getCartsForUserOrSession(customerId, sessionId);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getCartById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const cart = await cartModel.getCartById(id);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const customerId = req.user ? req.user.id : null;
    const sessionId = getSessionId(req);
    const owned =
      (customerId && cart.CustomerId === customerId) ||
      (sessionId && cart.SessionId === sessionId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'You cannot view this cart' });
    }
    res.status(200).json({ success: true, data: cart });
  } catch (err) {
    next(err);
  }
}

async function createCart(req, res, next) {
  try {
    const { stallId } = req.body;
    const customerId = req.user ? req.user.id : null;
    const sessionId = getSessionId(req) || (req.body && req.body.sessionId);

    if (!customerId && !sessionId) {
      return res.status(400).json({ success: false, message: 'Provide x-session-id header for guest carts' });
    }

    const exists = await cartModel.stallExists(stallId);
    if (!exists) return res.status(400).json({ success: false, message: 'Stall not found' });

    const existingId = await cartModel.findExistingCart(customerId, sessionId, stallId);
    if (existingId) {
      const existing = await cartModel.getCartById(existingId);
      return res.status(200).json({ success: true, message: 'Existing cart returned', data: existing });
    }

    const created = await cartModel.createCart({ customerId, sessionId, stallId });
    const withItems = await cartModel.getCartById(created.CartId);
    res.status(201).json({ success: true, message: 'Cart created', data: withItems });
  } catch (err) {
    next(err);
  }
}

async function deleteCart(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const cart = await cartModel.getCartById(id);
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const customerId = req.user ? req.user.id : null;
    const sessionId = getSessionId(req);
    const owned =
      (customerId && cart.CustomerId === customerId) ||
      (sessionId && cart.SessionId === sessionId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'You cannot delete this cart' });
    }

    const ok = await cartModel.deleteCart(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Cart not found' });
    res.status(200).json({ success: true, message: 'Cart deleted' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/checkout
 * Body: { cartIds: [1,2], guestName?: 'walk-in' }
 *
 * For each cart:
 *  1. Validate cart has items
 *  2. Calculate total from menuItem.price
 *  3. Create Order
 *  4. Create OrderItems
 *  5. Create OrderStatusLog
 *  6. Create vendor Notification
 *  7. Delete cart items + cart
 */
async function checkout(req, res, next) {
  try {
    const customerId = req.user ? req.user.id : null;
    const { cartIds, guestName } = req.body;
    if (!Array.isArray(cartIds) || !cartIds.length) {
      return res.status(400).json({ success: false, message: 'cartIds must be a non-empty array' });
    }

    const sessionId = getSessionId(req) || (req.body && req.body.sessionId);
    if (!customerId && !sessionId) {
      return res.status(400).json({ success: false, message: 'Authentication or session id required' });
    }

    const createdOrders = [];

    for (const cartIdRaw of cartIds) {
      const cartId = parseInt(cartIdRaw);
      const cart = await cartModel.getCartById(cartId);
      if (!cart) continue;

      const owned =
        (customerId && cart.CustomerId === customerId) ||
        (sessionId && cart.SessionId === sessionId);
      if (!owned) continue;

      if (!cart.Items || !cart.Items.length) {
        continue;
      }

      let total = 0;
      for (const it of cart.Items) {
        total += Number(it.Quantity) * Number(it.Price) + Number(it.AddOnCharge || 0);
      }

      const order = await orderModel.createOrder({
        stallId: cart.StallId,
        customerId: customerId || null,
        guestName: customerId ? null : (guestName || 'Walk-in Guest'),
        totalAmount: total,
        status: 'Pending',
        paymentStatus: 'Paid',
        specialInstructions: null,
      });

      for (const it of cart.Items) {
        await orderItemModel.createOrderItem({
          orderId: order.OrderId,
          menuItemId: it.MenuItemId,
          quantity: it.Quantity,
          unitPrice: it.Price,
          addOns: it.AddOns,
          addOnCharge: it.AddOnCharge,
        });
      }

      await orderStatusLogModel.createLog({
        orderId: order.OrderId,
        status: 'Pending',
        changedBy: customerId || null,
      });

      const stall = await stallModel.getStallById(cart.StallId);
      if (stall && stall.OwnerId) {
        await notificationModel.createNotification({
          userId: stall.OwnerId,
          title: 'New Order Received',
          message: `Order #${order.OrderId} placed at ${stall.Name} for ${formatPrice(total)}.`,
          type: 'Order',
        });
      }

      await cartItemModel.deleteAllItemsForCart(cartId);
      await cartModel.deleteCart(cartId);

      createdOrders.push({ ...order, stallName: cart.StallName });
    }

    res.status(201).json({
      success: true,
      message: `${createdOrders.length} order(s) created successfully`,
      data: { orders: createdOrders },
    });
  } catch (err) {
    next(err);
  }
}

function formatPrice(amount) {
  const n = parseFloat(amount);
  if (isNaN(n)) return '$0.00';
  return '$' + n.toFixed(2);
}

module.exports = {
  getUserCarts,
  getActiveCarts,
  getCartById,
  createCart,
  deleteCart,
  checkout,
};
