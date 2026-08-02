// routes/menuItemRoutes.js — /api/menu-items
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const menuItemController = require('../controllers/menuItemController');

router.get('/', menuItemController.getAllMenuItems);
router.post('/', verifyToken, checkRole('Vendor'), menuItemController.createMenuItem);

router.get('/:id', menuItemController.getMenuItemById);
router.put('/:id', verifyToken, checkRole('Vendor'), menuItemController.updateMenuItem);
router.delete('/:id', verifyToken, checkRole('Vendor'), menuItemController.deleteMenuItem);

module.exports = router;
