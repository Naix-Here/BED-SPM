// controllers/stallController.js — HTTP handlers for the /api/stalls endpoints.
const stallModel = require('../models/stallModel');
const hawkerCentreModel = require('../models/hawkerCentreModel');
const userModel = require('../models/userModel');
const { STALL_STATUS } = require('../config/constants');

/**
 * GET /api/stalls
 * Optional ?hawkerCentreId=
 */
async function getAllStalls(req, res) {
  try {
    const hawkerCentreId = req.query.hawkerCentreId ? parseInt(req.query.hawkerCentreId, 10) : null;
    const stalls = await stallModel.getAllStalls(hawkerCentreId);
    return res.status(200).json({
      success: true,
      message: 'Stalls retrieved successfully.',
      data: stalls,
      count: stalls.length,
    });
  } catch (error) {
    console.error('getAllStalls error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stalls.', error: error.message });
  }
}

/**
 * GET /api/stalls/:id
 * Returns stall + cuisines + current hygiene grade.
 */
async function getStallById(req, res) {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (Number.isNaN(stallId)) {
      return res.status(400).json({ success: false, message: 'Invalid stall id.' });
    }
    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(404).json({ success: false, message: 'Stall not found.' });
    }
    const cuisines = await stallModel.getCuisinesForStall(stallId);
    return res.status(200).json({
      success: true,
      message: 'Stall retrieved successfully.',
      data: { ...stall, Cuisines: cuisines },
    });
  } catch (error) {
    console.error('getStallById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stall.', error: error.message });
  }
}

/**
 * GET /api/stalls/:id/menu
 * Public menu listing for a stall (calls menuItem model directly).
 */
async function getStallMenu(req, res) {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (Number.isNaN(stallId)) {
      return res.status(400).json({ success: false, message: 'Invalid stall id.' });
    }
    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(404).json({ success: false, message: 'Stall not found.' });
    }
    const menuItemModel = require('../models/menuItemModel');
    const items = await menuItemModel.getAllMenuItems(stallId);
    return res.status(200).json({
      success: true,
      message: 'Menu retrieved successfully.',
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('getStallMenu error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stall menu.', error: error.message });
  }
}

/**
 * GET /api/stalls/:id/performance
 * Vendor(owner) or Operator only.
 */
async function getStallPerformance(req, res) {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (Number.isNaN(stallId)) {
      return res.status(400).json({ success: false, message: 'Invalid stall id.' });
    }
    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(404).json({ success: false, message: 'Stall not found.' });
    }
    if (req.user.role === 'Vendor' && stall.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only view performance for your own stall.' });
    }
    const stats = await stallModel.getStallPerformance(stallId);
    return res.status(200).json({
      success: true,
      message: 'Stall performance retrieved successfully.',
      data: { stallId, stallName: stall.Name, ...stats },
    });
  } catch (error) {
    console.error('getStallPerformance error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve stall performance.', error: error.message });
  }
}

/**
 * POST /api/stalls  (Operator only)
 */
async function createStall(req, res) {
  try {
    const { hawkerCentreId, ownerId, name, description, unitNumber, imageUrl, status } = req.body;

    if (!hawkerCentreId || !ownerId || !name || !unitNumber) {
      return res.status(400).json({ success: false, message: 'hawkerCentreId, ownerId, name, and unitNumber are required.' });
    }
    if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'name must be 1-100 characters.' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ success: false, message: 'description must be <= 500 characters.' });
    }
    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
      if (typeof imageUrl !== 'string' || imageUrl.length > 500) {
        return res.status(400).json({ success: false, message: 'imageUrl must be a string up to 500 characters.' });
      }
      try {
        const u = new URL(imageUrl);
        if (!['http:', 'https:'].includes(u.protocol)) {
          return res.status(400).json({ success: false, message: 'imageUrl must be a valid http(s) URL.' });
        }
      } catch {
        return res.status(400).json({ success: false, message: 'imageUrl must be a valid http(s) URL.' });
      }
    }
    if (status && !STALL_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${STALL_STATUS.join(', ')}.` });
    }

    // Validate FKs
    const hawkerCentre = await hawkerCentreModel.getById(hawkerCentreId);
    if (!hawkerCentre) {
      return res.status(400).json({ success: false, message: 'Hawker centre does not exist.' });
    }
    const owner = await userModel.findById(ownerId);
    if (!owner) {
      return res.status(400).json({ success: false, message: 'Owner does not exist.' });
    }
    if (owner.Role !== 'Vendor') {
      return res.status(400).json({ success: false, message: 'Owner must have the Vendor role.' });
    }

    const stall = await stallModel.createStall({
      hawkerCentreId, ownerId, name, description, unitNumber, imageUrl, status: status || 'Active',
    });
    return res.status(201).json({
      success: true,
      message: 'Stall created successfully.',
      data: stall,
    });
  } catch (error) {
    console.error('createStall error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create stall.', error: error.message });
  }
}

/**
 * PUT /api/stalls/:id  (Vendor owner or Operator)
 */
async function updateStall(req, res) {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (Number.isNaN(stallId)) {
      return res.status(400).json({ success: false, message: 'Invalid stall id.' });
    }
    const existing = await stallModel.getStallById(stallId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Stall not found.' });
    }
    if (req.user.role === 'Vendor' && existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own stall.' });
    }

    const { name, description, unitNumber, imageUrl, status } = req.body;
    if (!name || !unitNumber) {
      return res.status(400).json({ success: false, message: 'name and unitNumber are required.' });
    }
    if (name.length < 1 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'name must be 1-100 characters.' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ success: false, message: 'description must be <= 500 characters.' });
    }
    if (imageUrl !== undefined && imageUrl !== null && imageUrl !== '') {
      if (typeof imageUrl !== 'string' || imageUrl.length > 500) {
        return res.status(400).json({ success: false, message: 'imageUrl must be a string up to 500 characters.' });
      }
      try {
        const u = new URL(imageUrl);
        if (!['http:', 'https:'].includes(u.protocol)) {
          return res.status(400).json({ success: false, message: 'imageUrl must be a valid http(s) URL.' });
        }
      } catch {
        return res.status(400).json({ success: false, message: 'imageUrl must be a valid http(s) URL.' });
      }
    }
    if (status && !STALL_STATUS.includes(status)) {
      return res.status(400).json({ success: false, message: `status must be one of: ${STALL_STATUS.join(', ')}.` });
    }

    // Pass null when caller wants to clear the image; pass undefined to leave unchanged.
    const imageUpdate = imageUrl === undefined ? undefined : (imageUrl === '' ? null : imageUrl);

    const updated = await stallModel.updateStall(stallId, {
      name,
      description,
      unitNumber,
      imageUrl: imageUpdate,
      status: status || 'Active',
    });
    return res.status(200).json({
      success: true,
      message: 'Stall updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('updateStall error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update stall.', error: error.message });
  }
}

/**
 * DELETE /api/stalls/:id  (Operator only)
 */
async function deleteStall(req, res) {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (Number.isNaN(stallId)) {
      return res.status(400).json({ success: false, message: 'Invalid stall id.' });
    }
    const existing = await stallModel.getStallById(stallId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Stall not found.' });
    }
    const ok = await stallModel.deleteStall(stallId);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Failed to delete stall.' });
    }
    return res.status(200).json({ success: true, message: 'Stall deleted successfully.' });
  } catch (error) {
    console.error('deleteStall error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete stall.', error: error.message });
  }
}

module.exports = {
  getAllStalls,
  getStallById,
  getStallMenu,
  getStallPerformance,
  createStall,
  updateStall,
  deleteStall,
};
