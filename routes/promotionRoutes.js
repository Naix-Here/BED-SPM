// routes/promotionRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validatePromotion } = require('../middleware/validators');
const promotionController = require('../controllers/promotionController');

router.get('/', promotionController.getAllPromotions);

router.get('/:id', promotionController.getPromotionById);

router.post('/', verifyToken, checkRole('Vendor'), validatePromotion, promotionController.createPromotion);

router.put('/:id', verifyToken, checkRole('Vendor'), validatePromotion, promotionController.updatePromotion);

router.delete('/:id', verifyToken, checkRole('Vendor'), promotionController.deletePromotion);

module.exports = router;
