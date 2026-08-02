// routes/queueRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const checkRole = require('../middleware/checkRole');
const { validateJoinQueue, validateQueueStatus } = require('../middleware/validators');
const queueController = require('../controllers/queueController');

router.get('/', verifyToken, queueController.getAllQueueEntries);

router.get('/:id', verifyToken, queueController.getQueueEntryById);

router.post('/', verifyToken, checkRole('Customer'), validateJoinQueue, queueController.joinQueue);

router.put('/:id', verifyToken, checkRole('Customer', 'Vendor'), validateQueueStatus, queueController.updateQueueEntry);

router.delete('/:id', verifyToken, checkRole('Customer', 'Vendor'), queueController.deleteQueueEntry);

router.get('/stall/:stallId/position', verifyToken, checkRole('Customer'), queueController.getPosition);

router.get('/stall/:stallId/status', verifyToken, queueController.getStallQueueStatus);

module.exports = router;
