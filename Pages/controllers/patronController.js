const AppError = require('../utils/AppError');
const products = require('../models/productModel');
const orders = require('../models/orderModel');
const carts = require('../models/cartModel');
const rewards = require('../models/rewardModel');
async function listProducts(req, res) { res.json(await products.getAvailableProducts()); }
async function getCart(req, res) { res.json(await carts.getCart(req.user.id)); }
async function addToCart(req, res) { const id = Number(req.body.productId); if (!Number.isInteger(id)) throw new AppError('Choose a valid menu item.', 400); const product = await products.getAvailableProduct(id); if (!product) throw new AppError('That menu item is no longer available.', 404); const cart = await carts.getCart(req.user.id); const item = cart.find(entry => entry.productId === id); if (item) item.quantity += 1; else cart.push({ productId: product.ItemId, menuItemId: product.ItemId, name: product.Name, stall: product.StallName, cuisines: product.Cuisines, price: Number(product.EffectivePrice), emoji: product.Emoji, colour: product.Colour, quantity: 1 }); await carts.saveCart(req.user.id, cart); res.status(201).json(cart); }
async function updateCart(req, res) { const cart = await carts.getCart(req.user.id), item = cart.find(entry => entry.productId === Number(req.params.id)), quantity = Number(req.body.quantity); if (!item || !Number.isInteger(quantity)) throw new AppError('Invalid cart update.', 400); if (quantity <= 0) cart.splice(cart.indexOf(item), 1); else item.quantity = quantity; await carts.saveCart(req.user.id, cart); res.json(cart); }
async function listRewards(req, res) { res.json(await rewards.getRewards(req.user.id)); }
async function redeemReward(req, res) { const { type, id } = req.body; if (!['voucher', 'promotion'].includes(type) || !Number.isInteger(Number(id))) throw new AppError('Choose a valid reward.', 400); res.status(201).json(await rewards.redeemReward(req.user.id, type, Number(id))); }
async function submitOrder(req, res) { const cart = await carts.getCart(req.user.id); if (!cart.length) throw new AppError('Your cart is empty.', 400); const order = await orders.createOrder(req.user.id, cart, req.body.address, Boolean(req.body.ecoPackaging), req.body.reward); await carts.saveCart(req.user.id, []); res.status(201).json(order); }
async function listOrders(req, res) { res.json(await orders.getOrdersByUser(req.user.id)); }
module.exports = { listProducts, getCart, addToCart, updateCart, listRewards, redeemReward, submitOrder, listOrders };
