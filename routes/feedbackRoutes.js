// routes/feedbackRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const optionalAuth = require('../middleware/optionalAuth');
const checkRole = require('../middleware/checkRole');
const { validateFeedback } = require('../middleware/validators');
const feedbackController = require('../controllers/feedbackController');

router.get('/', optionalAuth, feedbackController.getAllFeedback);

router.get('/:id', optionalAuth, feedbackController.getFeedbackById);

router.post('/', verifyToken, checkRole('Customer'), validateFeedback, feedbackController.createFeedback);

router.put('/:id', verifyToken, checkRole('Customer', 'Operator'), validateFeedback, feedbackController.updateFeedback);

router.delete('/:id', verifyToken, checkRole('Customer', 'Operator'), feedbackController.deleteFeedback);

module.exports = router;
