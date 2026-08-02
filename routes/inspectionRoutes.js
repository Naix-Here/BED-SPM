// routes/inspectionRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateInspection } = require('../middleware/validators');
const inspectionController = require('../controllers/inspectionController');

router.get('/', verifyToken, inspectionController.getAllInspections);

router.get('/:id', verifyToken, inspectionController.getInspectionById);

router.post('/', verifyToken, checkRole('NEAOfficer'), validateInspection, inspectionController.createInspection);

router.put('/:id', verifyToken, checkRole('NEAOfficer'), validateInspection, inspectionController.updateInspection);

router.delete('/:id', verifyToken, checkRole('NEAOfficer'), inspectionController.deleteInspection);

module.exports = router;
