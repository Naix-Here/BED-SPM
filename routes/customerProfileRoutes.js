// routes/customerProfileRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateCustomerProfile } = require('../middleware/validators');
const customerProfileController = require('../controllers/customerProfileController');

router.get('/', verifyToken, checkRole('Customer'), customerProfileController.getOwnProfile);

router.get('/:id', verifyToken, checkRole('Customer', 'Operator'), customerProfileController.getProfileById);

router.post('/', verifyToken, checkRole('Customer'), validateCustomerProfile, customerProfileController.createProfile);

router.put('/', verifyToken, checkRole('Customer'), validateCustomerProfile, customerProfileController.updateProfile);

router.delete('/:id', verifyToken, checkRole('Customer', 'Operator'), customerProfileController.deleteProfile);

module.exports = router;
