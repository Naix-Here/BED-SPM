// routes/vendorProfileRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateVendorProfile } = require('../middleware/validators');
const vendorProfileController = require('../controllers/vendorProfileController');

router.get('/', verifyToken, checkRole('Vendor'), vendorProfileController.getOwnProfile);

router.get('/:id', verifyToken, checkRole('Vendor', 'Operator'), vendorProfileController.getProfileById);

router.post('/', verifyToken, checkRole('Vendor'), validateVendorProfile, vendorProfileController.createProfile);

router.put('/', verifyToken, checkRole('Vendor'), validateVendorProfile, vendorProfileController.updateProfile);

router.delete('/:id', verifyToken, checkRole('Operator'), vendorProfileController.deleteProfile);

module.exports = router;
