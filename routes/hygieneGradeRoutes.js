// routes/hygieneGradeRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateHygieneGrade } = require('../middleware/validators');
const hygieneGradeController = require('../controllers/hygieneGradeController');

router.get('/', verifyToken, hygieneGradeController.getAllGrades);

router.get('/stall/:stallId', verifyToken, hygieneGradeController.getStallHistory);

router.get('/:id', verifyToken, hygieneGradeController.getGradeById);

router.post('/', verifyToken, checkRole('NEAOfficer'), validateHygieneGrade, hygieneGradeController.createGrade);

router.put('/:id', verifyToken, checkRole('NEAOfficer'), validateHygieneGrade, hygieneGradeController.updateGrade);

router.delete('/:id', verifyToken, checkRole('NEAOfficer'), hygieneGradeController.deleteGrade);

module.exports = router;
