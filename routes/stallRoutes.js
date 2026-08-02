// routes/stallRoutes.js — /api/stalls
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateStall } = require('../middleware/validators');
const stallController = require('../controllers/stallController');

router.get('/', stallController.getAllStalls);
router.post('/', verifyToken, checkRole('Operator'), validateStall, stallController.createStall);

router.get('/:id', stallController.getStallById);
router.put('/:id', verifyToken, checkRole('Vendor', 'Operator'), validateStall, stallController.updateStall);
router.delete('/:id', verifyToken, checkRole('Operator'), stallController.deleteStall);

router.get('/:id/menu', stallController.getStallMenu);

router.get('/:id/performance', verifyToken, checkRole('Vendor', 'Operator'), stallController.getStallPerformance);

module.exports = router;
