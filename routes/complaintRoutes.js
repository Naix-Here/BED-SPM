// routes/complaintRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateComplaint, validateComplaintStatus } = require('../middleware/validators');
const complaintController = require('../controllers/complaintController');

router.get('/', verifyToken, complaintController.getAllComplaints);

router.get('/mine', verifyToken, checkRole('Customer'), complaintController.getMyComplaints);

router.get('/:id', verifyToken, complaintController.getComplaintById);

router.post('/', verifyToken, checkRole('Customer'), validateComplaint, complaintController.createComplaint);

router.put('/:id', verifyToken, checkRole('Operator', 'NEAOfficer'), validateComplaintStatus, complaintController.updateComplaint);

router.delete('/:id', verifyToken, checkRole('Operator'), complaintController.deleteComplaint);

module.exports = router;
