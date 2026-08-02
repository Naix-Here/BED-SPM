// controllers/promotionController.js
const promotionModel = require('../models/promotionModel');
const stallModel = require('../models/stallModel');

async function getAllPromotions(req, res, next) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId) : null;
    const rows = await promotionModel.getAllPromotions(stallId, true);
    res.status(200).json({ success: true, message: 'Promotions retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getPromotionById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await promotionModel.getPromotionById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Promotion not found' });
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createPromotion(req, res, next) {
  try {
    const { stallId, title, description, discountType, discountValue, startDate, endDate, isActive } = req.body;

    const exists = await promotionModel.stallExists(stallId);
    if (!exists) return res.status(400).json({ success: false, message: 'Stall not found' });

    if (req.user.role === 'Vendor') {
      const ownerStalls = await stallModel.getStallsByOwnerId(req.user.id);
      if (!ownerStalls.some((s) => s.StallId === stallId)) {
        return res.status(403).json({ success: false, message: 'You can only create promotions for your own stalls' });
      }
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const created = await promotionModel.createPromotion({
      stallId, title, description, discountType, discountValue,
      startDate, endDate, isActive: isActive !== false,
    });
    res.status(201).json({ success: true, message: 'Promotion created', data: created });
  } catch (err) {
    next(err);
  }
}

async function updatePromotion(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const { title, description, discountType, discountValue, startDate, endDate, isActive } = req.body;
    const existing = await promotionModel.getPromotionById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Promotion not found' });

    if (req.user.role === 'Vendor' && existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own promotions' });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date must be after start date' });
    }

    const updated = await promotionModel.updatePromotion(id, {
      title, description, discountType, discountValue,
      startDate, endDate, isActive: isActive !== false,
    });
    res.status(200).json({ success: true, message: 'Promotion updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deletePromotion(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await promotionModel.getPromotionById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Promotion not found' });

    if (req.user.role === 'Vendor' && existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own promotions' });
    }

    const ok = await promotionModel.deletePromotion(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Promotion not found' });
    res.status(200).json({ success: true, message: 'Promotion deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
};
