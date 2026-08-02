// routes/rentalAgreementRoutes.js — /api/rental-agreements
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const controller = require('../controllers/rentalAgreementController');

router.get('/', verifyToken, checkRole('Vendor', 'Operator'), controller.getAllAgreements);
router.post('/', verifyToken, checkRole('Operator'), controller.createAgreement);

router.get('/:id', verifyToken, checkRole('Vendor', 'Operator'), controller.getAgreementById);
router.put('/:id', verifyToken, checkRole('Operator'), controller.updateAgreement);
router.delete('/:id', verifyToken, checkRole('Operator'), controller.deleteAgreement);

module.exports = router;
