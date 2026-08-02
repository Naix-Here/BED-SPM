// controllers/likesController.js
const likesModel = require('../models/likesModel');

async function getAllLikes(req, res, next) {
  try {
    const menuItemId = req.query.menuItemId ? parseInt(req.query.menuItemId) : null;
    const customerId = req.query.customerId ? parseInt(req.query.customerId) : null;
    const rows = await likesModel.getAllLikes(menuItemId, customerId);
    res.status(200).json({ success: true, message: 'Likes retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getLikeById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await likesModel.getLikeById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Like not found' });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createLike(req, res, next) {
  try {
    const { menuItemId } = req.body;
    const customerId = req.user.id;

    const exists = await likesModel.menuItemExists(menuItemId);
    if (!exists) {
      return res.status(400).json({ success: false, message: 'Menu item not found' });
    }
    const dup = await likesModel.findLikeByMenuAndCustomer(menuItemId, customerId);
    if (dup) {
      return res.status(409).json({
        success: false,
        message: 'You have already liked this menu item',
        data: dup,
      });
    }
    const created = await likesModel.createLike({ menuItemId, customerId });
    const likeCount = await likesModel.getLikeCountForMenuItem(menuItemId);
    res.status(201).json({ success: true, message: 'Like recorded', data: { ...created, LikeCount: likeCount } });
  } catch (err) {
    if (err && err.number === 2627) {
      return res.status(409).json({ success: false, message: 'You have already liked this menu item' });
    }
    next(err);
  }
}

async function deleteLike(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await likesModel.getLikeById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Like not found' });
    if (existing.CustomerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only remove your own like' });
    }
    const ok = await likesModel.deleteLike(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Like not found' });
    res.status(200).json({ success: true, message: 'Like removed' });
  } catch (err) {
    next(err);
  }
}

async function getLikeCount(req, res, next) {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    const count = await likesModel.getLikeCountForMenuItem(menuItemId);
    res.status(200).json({ success: true, data: { menuItemId, likeCount: count } });
  } catch (err) {
    next(err);
  }
}

async function checkIfLiked(req, res, next) {
  try {
    const menuItemId = parseInt(req.params.menuItemId);
    const customerId = req.user.id;
    const like = await likesModel.findLikeByMenuAndCustomer(menuItemId, customerId);
    res.status(200).json({ success: true, data: { menuItemId, liked: !!like, like: like || null } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllLikes,
  getLikeById,
  createLike,
  deleteLike,
  getLikeCount,
  checkIfLiked,
};
