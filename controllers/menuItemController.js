// controllers/menuItemController.js — HTTP handlers for /api/menu-items.
const menuItemModel = require('../models/menuItemModel');
const stallModel = require('../models/stallModel');
const { MENU_CATEGORIES } = require('../config/constants');

/**
 * GET /api/menu-items  (public, optional ?stallId=)
 */
async function getAllMenuItems(req, res) {
  try {
    const stallId = req.query.stallId ? parseInt(req.query.stallId, 10) : null;
    const items = await menuItemModel.getAllMenuItems(stallId);
    return res.status(200).json({
      success: true,
      message: 'Menu items retrieved successfully.',
      data: items,
      count: items.length,
    });
  } catch (error) {
    console.error('getAllMenuItems error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve menu items.', error: error.message });
  }
}

/**
 * GET /api/menu-items/:id  (public)
 */
async function getMenuItemById(req, res) {
  try {
    const menuItemId = parseInt(req.params.id, 10);
    if (Number.isNaN(menuItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item id.' });
    }
    const item = await menuItemModel.getMenuItemById(menuItemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    const cuisines = await menuItemModel.getCuisinesForMenuItem(menuItemId);
    return res.status(200).json({
      success: true,
      message: 'Menu item retrieved successfully.',
      data: { ...item, Cuisines: cuisines },
    });
  } catch (error) {
    console.error('getMenuItemById error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve menu item.', error: error.message });
  }
}

/**
 * POST /api/menu-items  (Vendor only)
 * The stall must be owned by the vendor.
 * Body may also include `cuisineIds: number[]` — we will create the MenuItemCuisine rows after.
 */
async function createMenuItem(req, res) {
  try {
    const { stallId, name, description, price, category, isAvailable, cuisineIds } = req.body;
    if (!stallId || !name || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'stallId, name, price, and category are required.' });
    }
    if (typeof name !== 'string' || name.length < 1 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'name must be 1-100 characters.' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ success: false, message: 'description must be <= 500 characters.' });
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'price must be a positive number.' });
    }
    if (!MENU_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `category must be one of: ${MENU_CATEGORIES.join(', ')}.` });
    }

    const stall = await stallModel.getStallById(stallId);
    if (!stall) {
      return res.status(400).json({ success: false, message: 'Stall does not exist.' });
    }
    if (stall.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only add items to your own stall.' });
    }

    const item = await menuItemModel.createMenuItem({
      stallId, name, description, price: priceNum, category,
      isAvailable: isAvailable === false ? false : true,
    });

    let cuisines = [];
    if (Array.isArray(cuisineIds) && cuisineIds.length) {
      const menuItemCuisineModel = require('../models/menuItemCuisineModel');
      for (const cuisineId of cuisineIds) {
        const exists = await menuItemCuisineModel.mappingExists(item.MenuItemId, cuisineId);
        if (!exists) {
          await menuItemCuisineModel.createMapping({ menuItemId: item.MenuItemId, cuisineId: Number(cuisineId) });
        }
      }
      cuisines = await menuItemModel.getCuisinesForMenuItem(item.MenuItemId);
    }

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      data: { ...item, Cuisines: cuisines },
    });
  } catch (error) {
    console.error('createMenuItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create menu item.', error: error.message });
  }
}

/**
 * PUT /api/menu-items/:id  (Vendor owner only)
 * Body may include `cuisineIds: number[]` to fully replace the cuisine mapping.
 */
async function updateMenuItem(req, res) {
  try {
    const menuItemId = parseInt(req.params.id, 10);
    if (Number.isNaN(menuItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item id.' });
    }
    const existing = await menuItemModel.getMenuItemById(menuItemId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    if (existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only update your own menu items.' });
    }

    const { name, description, price, category, isAvailable, cuisineIds } = req.body;
    if (!name || price === undefined || !category) {
      return res.status(400).json({ success: false, message: 'name, price, and category are required.' });
    }
    if (name.length < 1 || name.length > 100) {
      return res.status(400).json({ success: false, message: 'name must be 1-100 characters.' });
    }
    if (description && description.length > 500) {
      return res.status(400).json({ success: false, message: 'description must be <= 500 characters.' });
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ success: false, message: 'price must be a positive number.' });
    }
    if (!MENU_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: `category must be one of: ${MENU_CATEGORIES.join(', ')}.` });
    }

    const updated = await menuItemModel.updateMenuItem(menuItemId, {
      name, description, price: priceNum, category,
      isAvailable: isAvailable === false ? false : true,
    });

    let cuisines = [];
    if (Array.isArray(cuisineIds)) {
      const menuItemCuisineModel = require('../models/menuItemCuisineModel');
      const existingMappings = await menuItemCuisineModel.getAllMappings(menuItemId);
      for (const m of existingMappings) {
        await menuItemCuisineModel.deleteMapping(m.MenuItemCuisineId);
      }
      for (const cuisineId of cuisineIds) {
        await menuItemCuisineModel.createMapping({ menuItemId, cuisineId: Number(cuisineId) });
      }
      cuisines = await menuItemModel.getCuisinesForMenuItem(menuItemId);
    } else {
      cuisines = await menuItemModel.getCuisinesForMenuItem(menuItemId);
    }

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully.',
      data: { ...updated, Cuisines: cuisines },
    });
  } catch (error) {
    console.error('updateMenuItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update menu item.', error: error.message });
  }
}

/**
 * DELETE /api/menu-items/:id  (Vendor owner only)
 */
async function deleteMenuItem(req, res) {
  try {
    const menuItemId = parseInt(req.params.id, 10);
    if (Number.isNaN(menuItemId)) {
      return res.status(400).json({ success: false, message: 'Invalid menu item id.' });
    }
    const existing = await menuItemModel.getMenuItemById(menuItemId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Menu item not found.' });
    }
    if (existing.OwnerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only delete your own menu items.' });
    }
    const ok = await menuItemModel.deleteMenuItem(menuItemId);
    if (!ok) {
      return res.status(500).json({ success: false, message: 'Failed to delete menu item.' });
    }
    return res.status(200).json({ success: true, message: 'Menu item deleted successfully.' });
  } catch (error) {
    console.error('deleteMenuItem error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete menu item.', error: error.message });
  }
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
