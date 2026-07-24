// controllers/vendorManagementController.js — Vendor management endpoints
const AppError = require('../utils/AppError');
const VendorMenu = require('../models/vendorMenuModel');
const VendorStall = require('../models/vendorStallModel');
const RentalAgreement = require('../models/rentalAgreementModel');

// ===== MENU ITEMS =====
async function getMenuItems(req, res, next) {
  try {
    const result = await VendorMenu.findAll({
      stallId: req.query.stall_id || null, category: req.query.category || null,
      search: req.query.search || null, cuisine: req.query.cuisine || null,
      page: parseInt(req.query.page) || 1, limit: Math.min(parseInt(req.query.limit) || 20, 100)
    });
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

async function getPopularItems(req, res, next) {
  try {
    const items = await VendorMenu.getPopular(parseInt(req.query.limit) || 10, req.query.stall_id || null);
    res.json({ success: true, count: items.length, data: items });
  } catch (err) { next(err); }
}

async function getMenuItemById(req, res, next) {
  try {
    const id = parseInt(req.params.itemId);
    if (isNaN(id)) throw new AppError('Invalid item ID.', 400);
    const item = await VendorMenu.findById(id);
    if (!item) throw new AppError('Menu item not found.', 404);
    res.json({ success: true, data: item });
  } catch (err) { next(err); }
}

async function createMenuItem(req, res, next) {
  try {
    const { stall_id, name, description, price, category, image_url, is_available, is_promotion, promotion_price, promotion_start, promotion_end, cuisine_ids } = req.body;
    if (!stall_id || !name || price === undefined) throw new AppError('stall_id, name, and price are required.', 400);
    if (req.user.role === 'vendor') {
      const stall = await VendorStall.findById(stall_id);
      if (!stall || stall.OwnerId !== req.user.id) throw new AppError('You can only add items to your own stalls.', 403);
    }
    const item = await VendorMenu.create({ stallId: stall_id, name, description, price, category, imageUrl: image_url, isAvailable: is_available, isPromotion: is_promotion, promotionPrice: promotion_price, promotionStart: promotion_start, promotionEnd: promotion_end }, cuisine_ids || []);
    res.status(201).json({ success: true, message: 'Menu item created.', data: item });
  } catch (err) { next(err); }
}

async function updateMenuItem(req, res, next) {
  try {
    const id = parseInt(req.params.itemId);
    if (isNaN(id)) throw new AppError('Invalid item ID.', 400);
    const existing = await VendorMenu.findById(id);
    if (!existing) throw new AppError('Menu item not found.', 404);
    if (req.user.role === 'vendor' && existing.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    const { cuisine_ids, stall_id, ...rest } = req.body;
    if (stall_id !== undefined && req.user.role === 'vendor') {
      const stall = await VendorStall.findById(stall_id);
      if (!stall || stall.OwnerId !== req.user.id) throw new AppError('You can only move an item to your own stall.', 403);
    }
    const mapped = {};
    if (stall_id !== undefined) mapped.StallId = stall_id;
    if (rest.name !== undefined) mapped.Name = rest.name;
    if (rest.description !== undefined) mapped.Description = rest.description;
    if (rest.price !== undefined) mapped.Price = rest.price;
    if (rest.category !== undefined) mapped.Category = rest.category;
    if (rest.image_url !== undefined) mapped.ImageUrl = rest.image_url;
    if (rest.is_available !== undefined) mapped.IsAvailable = rest.is_available;
    if (rest.is_promotion !== undefined) mapped.IsPromotion = rest.is_promotion;
    if (rest.promotion_price !== undefined) mapped.PromotionPrice = rest.promotion_price;
    if (rest.promotion_start !== undefined) mapped.PromotionStart = rest.promotion_start;
    if (rest.promotion_end !== undefined) mapped.PromotionEnd = rest.promotion_end;
    const updated = await VendorMenu.update(id, mapped, cuisine_ids !== undefined ? cuisine_ids : null);
    res.json({ success: true, message: 'Menu item updated.', data: updated });
  } catch (err) { next(err); }
}

async function deleteMenuItem(req, res, next) {
  try {
    const id = parseInt(req.params.itemId);
    if (isNaN(id)) throw new AppError('Invalid item ID.', 400);
    const existing = await VendorMenu.findById(id);
    if (!existing) throw new AppError('Menu item not found.', 404);
    if (req.user.role === 'vendor' && existing.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    res.json({ success: true, ...await VendorMenu.delete(id) });
  } catch (err) { next(err); }
}

async function toggleLike(req, res, next) {
  try {
    const id = parseInt(req.params.itemId);
    if (isNaN(id)) throw new AppError('Invalid item ID.', 400);
    res.json({ success: true, data: await VendorMenu.toggleLike(id, req.user.id) });
  } catch (err) { next(err); }
}

// ===== STALLS =====
async function getMyStalls(req, res, next) {
  try {
    const stalls = await VendorStall.findByOwnerId(req.user.id);
    res.json({ success: true, count: stalls.length, data: stalls });
  } catch (err) { next(err); }
}

async function getStallById(req, res, next) {
  try {
    const id = parseInt(req.params.stallId);
    if (isNaN(id)) throw new AppError('Invalid stall ID.', 400);
    const stall = await VendorStall.findById(id);
    if (!stall) throw new AppError('Stall not found.', 404);
    res.json({ success: true, data: stall });
  } catch (err) { next(err); }
}

async function updateStall(req, res, next) {
  try {
    const id = parseInt(req.params.stallId);
    if (isNaN(id)) throw new AppError('Invalid stall ID.', 400);
    const existing = await VendorStall.findById(id);
    if (!existing) throw new AppError('Stall not found.', 404);
    if (existing.OwnerId !== req.user.id && req.user.role !== 'nea_officer') throw new AppError('Access denied.', 403);
    const updated = await VendorStall.update(id, req.body);
    res.json({ success: true, message: 'Stall updated.', data: updated });
  } catch (err) { next(err); }
}

async function getStallDashboard(req, res, next) {
  try {
    const id = parseInt(req.params.stallId);
    if (isNaN(id)) throw new AppError('Invalid stall ID.', 400);
    const stall = await VendorStall.findById(id);
    if (!stall) throw new AppError('Stall not found.', 404);
    if (req.user.role === 'vendor' && stall.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    const data = await VendorStall.getDashboard(id, req.query.period || '30days');
    res.json({ success: true, data: { stall: { stallId: stall.StallId, stallName: stall.StallName }, ...data } });
  } catch (err) { next(err); }
}

// ===== RENTAL AGREEMENTS =====
async function getRentalAgreements(req, res, next) {
  try {
    res.json({ success: true, count: (await RentalAgreement.findByVendorId(req.user.id)).length, data: await RentalAgreement.findByVendorId(req.user.id) });
  } catch (err) { next(err); }
}

async function getUpcomingExpiries(req, res, next) {
  try {
    const agreements = await RentalAgreement.getUpcomingExpiries(req.user.id, parseInt(req.query.days) || 30);
    res.json({ success: true, count: agreements.length, data: agreements });
  } catch (err) { next(err); }
}

async function getRentalAgreementById(req, res, next) {
  try {
    const id = parseInt(req.params.agreementId);
    if (isNaN(id)) throw new AppError('Invalid agreement ID.', 400);
    const agreement = await RentalAgreement.findById(id);
    if (!agreement) throw new AppError('Rental agreement not found.', 404);
    if (req.user.role === 'vendor' && agreement.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    res.json({ success: true, data: agreement });
  } catch (err) { next(err); }
}

async function createRentalAgreement(req, res, next) {
  try {
    const { stall_id, start_date, end_date, monthly_rent, deposit, terms, signed_date } = req.body;
    if (!stall_id || !start_date || !end_date || !monthly_rent) throw new AppError('stall_id, start_date, end_date, and monthly_rent are required.', 400);
    if (req.user.role === 'vendor') {
      const stall = await VendorStall.findById(stall_id);
      if (!stall || stall.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    }
    const agreement = await RentalAgreement.create({ stallId: stall_id, startDate: start_date, endDate: end_date, monthlyRent: monthly_rent, deposit, terms, signedDate: signed_date || null });
    res.status(201).json({ success: true, message: 'Rental agreement created.', data: agreement });
  } catch (err) { next(err); }
}

async function updateRentalAgreement(req, res, next) {
  try {
    const id = parseInt(req.params.agreementId);
    if (isNaN(id)) throw new AppError('Invalid agreement ID.', 400);
    const existing = await RentalAgreement.findById(id);
    if (!existing) throw new AppError('Rental agreement not found.', 404);
    if (req.user.role === 'vendor' && existing.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    const fieldMap = { start_date: 'StartDate', end_date: 'EndDate', monthly_rent: 'MonthlyRent', deposit: 'Deposit', terms: 'Terms', status: 'Status', signed_date: 'SignedDate' };
    const data = Object.fromEntries(Object.entries(req.body).map(([key, value]) => [fieldMap[key] || key, value]));
    const updated = await RentalAgreement.update(id, data);
    res.json({ success: true, message: 'Agreement updated.', data: updated });
  } catch (err) { next(err); }
}

async function deleteRentalAgreement(req, res, next) {
  try {
    const id = parseInt(req.params.agreementId);
    if (isNaN(id)) throw new AppError('Invalid agreement ID.', 400);
    const existing = await RentalAgreement.findById(id);
    if (!existing) throw new AppError('Rental agreement not found.', 404);
    if (req.user.role === 'vendor' && existing.OwnerId !== req.user.id) throw new AppError('Access denied.', 403);
    res.json({ success: true, ...await RentalAgreement.delete(id) });
  } catch (err) { next(err); }
}

module.exports = {
  getMenuItems, getPopularItems, getMenuItemById, createMenuItem, updateMenuItem, deleteMenuItem, toggleLike,
  getMyStalls, getStallById, updateStall, getStallDashboard,
  getRentalAgreements, getUpcomingExpiries, getRentalAgreementById, createRentalAgreement, updateRentalAgreement, deleteRentalAgreement
};
