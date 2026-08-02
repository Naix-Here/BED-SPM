// controllers/cartItemController.js
const cartItemModel = require('../models/cartItemModel');
const cartModel = require('../models/cartModel');
const menuItemModel = require('../models/menuItemModel');

async function getAllCartItems(req, res, next) {
  try {
    if (!req.query.cartId) {
      return res.status(400).json({ success: false, message: 'cartId query parameter is required' });
    }
    const cartId = parseInt(req.query.cartId);
    const rows = await cartItemModel.getAllCartItems(cartId);
    res.status(200).json({ success: true, data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getCartItemById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await cartItemModel.getCartItemById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Cart item not found' });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createCartItem(req, res, next) {
  try {
    const { cartId, menuItemId, quantity, addOns, addOnCharge } = req.body;
    const cart = await cartModel.getCartById(cartId);
    if (!cart) return res.status(400).json({ success: false, message: 'Cart not found' });

    const customerId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const owned =
      (customerId && cart.CustomerId === customerId) ||
      (sessionId && cart.SessionId === sessionId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'You cannot add items to this cart' });
    }

    const item = await menuItemModel.getMenuItemById(menuItemId);
    if (!item) return res.status(400).json({ success: false, message: 'Menu item not found' });
    if (item.IsAvailable === false || item.IsAvailable === 0) {
      return res.status(400).json({ success: false, message: 'Menu item is not available' });
    }

    const created = await cartItemModel.createCartItem({
      cartId, menuItemId, quantity, addOns, addOnCharge,
    });
    const withDetails = await cartItemModel.getCartItemById(created.CartItemId);
    res.status(201).json({ success: true, message: 'Item added to cart', data: withDetails });
  } catch (err) {
    next(err);
  }
}

async function updateCartItem(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await cartItemModel.getCartItemById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Cart item not found' });

    const customerId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const cart = await cartModel.getCartById(existing.CartId);
    if (!cart) return res.status(404).json({ success: false, message: 'Parent cart not found' });
    const owned =
      (customerId && cart.CustomerId === customerId) ||
      (sessionId && cart.SessionId === sessionId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'You cannot update this cart item' });
    }

    const { quantity, addOns, addOnCharge } = req.body;
    const updated = await cartItemModel.updateCartItem(id, { quantity, addOns, addOnCharge });
    const withDetails = await cartItemModel.getCartItemById(updated.CartItemId);
    res.status(200).json({ success: true, message: 'Cart item updated', data: withDetails });
  } catch (err) {
    next(err);
  }
}

async function deleteCartItem(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await cartItemModel.getCartItemById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Cart item not found' });

    const customerId = req.user ? req.user.id : null;
    const sessionId = req.headers['x-session-id'] || req.body.sessionId;
    const cart = await cartModel.getCartById(existing.CartId);
    if (!cart) return res.status(404).json({ success: false, message: 'Parent cart not found' });
    const owned =
      (customerId && cart.CustomerId === customerId) ||
      (sessionId && cart.SessionId === sessionId);
    if (!owned) {
      return res.status(403).json({ success: false, message: 'You cannot delete this cart item' });
    }

    const ok = await cartItemModel.deleteCartItem(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Cart item not found' });
    res.status(200).json({ success: true, message: 'Cart item removed' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllCartItems,
  getCartItemById,
  createCartItem,
  updateCartItem,
  deleteCartItem,
};
