// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken');
const { validateNotification } = require('../middleware/validators');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyToken, notificationController.getMyNotifications);

router.get('/unread-count', verifyToken, notificationController.getUnreadCount);

router.put('/mark-all-read', verifyToken, notificationController.markAllRead);

router.get('/:id', verifyToken, notificationController.getNotificationById);

router.post('/', verifyToken, validateNotification, notificationController.createNotification);

router.put('/:id', verifyToken, notificationController.updateNotification);

router.delete('/:id', verifyToken, notificationController.deleteNotification);

module.exports = router;
