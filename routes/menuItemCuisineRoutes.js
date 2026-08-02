// routes/menuItemCuisineRoutes.js — /api/menu-item-cuisines
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const controller = require('../controllers/menuItemCuisineController');

router.get('/', controller.getAllMappings);
router.post('/', verifyToken, checkRole('Vendor'), controller.createMapping);

router.get('/:id', controller.getMappingById);
router.put('/:id', verifyToken, checkRole('Vendor'), controller.updateMapping);
router.delete('/:id', verifyToken, checkRole('Vendor'), controller.deleteMapping);

module.exports = router;
