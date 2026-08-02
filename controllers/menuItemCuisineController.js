// controllers/menuItemCuisineController.js — HTTP handlers for /api/menu-item-cuisines.
const menuItemCuisineModel = require('../models/menuItemCuisineModel');
const menuItemModel = require('../models/menuItemModel');
const cuisineModel = require('../models/cuisineModel');

/**
 * GET /api/menu-item-cuisines  (public, optional ?menuItemId=)
 */
async function getAllMappings(req, res) {
  try {
    const menuItemId = req.query.menuItemId ? parseInt(req.query.menuItemId, 10) : null;
    const mappings = await menuItemCuisineModel.getAllMappings(menuItemId);
    return res.status(200).json({
      success: true,
      message: 'Mappings retrieved successfully.',
      data: mappings,
      count: mappings.length,
    });
  } catch (error) {
    console.error('getAllMappings error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve mappings.', error: error.message });
  }
}

/**
 * GET /api/menu-item-cuisines/:id  (public)
 */
async function getMappingById(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const mapping = await menuItemCuisineModel.getMappingById(id);
    if (!mapping) {
      return res.status(404).json({ success: false, message: 'Mapping not found.' });
    }
    return res.status(200).json({
      success: true,
      message: 'Mapping retrieved successfully.',
      data: mapping,
    });
  } catch (error) {
    console.error('getMappingById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve mapping.', error: error.message });
  }
}

/**
 * POST /api/menu-item-cuisines  (Vendor only)
 */
async function createMapping(req, res) {
  try {
    const { menuItemId, cuisineId } = req.body;
    if (!menuItemId || !cuisineId) {
      return res.status(400).json({ success: false, message: 'menuItemId and cuisineId are required.' });
    }

    const menuItem = await menuItemModel.getMenuItemById(Number(menuItemId));
    if (!menuItem) {
      return res.status(400).json({ success: false, message: 'Menu item does not exist.' });
    }
    if (menuItem.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only manage cuisines for your own menu items.' });
    }
    const cuisine = await cuisineModel.getById(Number(cuisineId));
    if (!cuisine) {
      return res.status(400).json({ success: false, message: 'Cuisine does not exist.' });
    }

    const exists = await menuItemCuisineModel.mappingExists(Number(menuItemId), Number(cuisineId));
    if (exists) {
      return res.status(409).json({ success: false, message: 'This menu item is already linked to that cuisine.' });
    }

    const mapping = await menuItemCuisineModel.createMapping({ menuItemId, cuisineId });
    return res.status(201).json({
      success: true,
      message: 'Cuisine assigned successfully.',
      data: { ...mapping, MenuItemName: menuItem.Name, CuisineName: cuisine.Name },
    });
  } catch (error) {
    console.error('createMapping error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create mapping.', error: error.message });
  }
}

/**
 * PUT /api/menu-item-cuisines/:id  (Vendor owner only)
 */
async function updateMapping(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const existing = await menuItemCuisineModel.getMappingById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mapping not found.' });
    }
    if (existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only manage cuisines for your own menu items.' });
    }

    const { menuItemId, cuisineId } = req.body;
    if (!menuItemId || !cuisineId) {
      return res.status(400).json({ success: false, message: 'menuItemId and cuisineId are required.' });
    }

    const menuItem = await menuItemModel.getMenuItemById(Number(menuItemId));
    if (!menuItem) {
      return res.status(400).json({ success: false, message: 'Menu item does not exist.' });
    }
    if (menuItem.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only re-assign cuisines for your own menu items.' });
    }
    const cuisine = await cuisineModel.getById(Number(cuisineId));
    if (!cuisine) {
      return res.status(400).json({ success: false, message: 'Cuisine does not exist.' });
    }

    const updated = await menuItemCuisineModel.updateMapping(id, { menuItemId, cuisineId });
    return res.status(200).json({
      success: true,
      message: 'Mapping updated successfully.',
      data: updated,
    });
  } catch (error) {
    console.error('updateMapping error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update mapping.', error: error.message });
  }
}

/**
 * DELETE /api/menu-item-cuisines/:id  (Vendor owner only)
 */
async function deleteMapping(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid id.' });
    }
    const existing = await menuItemCuisineModel.getMappingById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Mapping not found.' });
    }
    if (existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only remove cuisines from your own menu items.' });
    }
    const ok = await menuItemCuisineModel.deleteMapping(id);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Failed to delete mapping.' });
    }
    return res.status(200).json({ success: true, message: 'Mapping deleted successfully.' });
  } catch (error) {
    console.error('deleteMapping error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete mapping.', error: error.message });
  }
}

module.exports = {
  getAllMappings,
  getMappingById,
  createMapping,
  updateMapping,
  deleteMapping,
};
