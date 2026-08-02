// controllers/notificationController.js
const notificationModel = require('../models/notificationModel');

async function getMyNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const rows = await notificationModel.getAllNotifications(userId);
    res.status(200).json({ success: true, message: 'Notifications retrieved', data: rows, count: rows.length });
  } catch (err) {
    next(err);
  }
}

async function getNotificationById(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const row = await notificationModel.getNotificationById(id);
    if (!row) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (row.UserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot view this notification' });
    }
    res.status(200).json({ success: true, data: row });
  } catch (err) {
    next(err);
  }
}

async function createNotification(req, res, next) {
  try {
    const { userId, title, message, type } = req.body;
    const created = await notificationModel.createNotification({
      userId, title, message, type, isRead: false,
    });
    res.status(201).json({ success: true, message: 'Notification created', data: created });
  } catch (err) {
    next(err);
  }
}

async function updateNotification(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await notificationModel.getNotificationById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (existing.UserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot modify this notification' });
    }
    const updated = await notificationModel.updateNotification(id, { isRead: !!req.body.isRead });
    res.status(200).json({ success: true, message: 'Notification updated', data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const id = parseInt(req.params.id);
    const existing = await notificationModel.getNotificationById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Notification not found' });
    if (existing.UserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot delete this notification' });
    }
    const ok = await notificationModel.deleteNotification(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
}

async function getUnreadCount(req, res, next) {
  try {
    const count = await notificationModel.getUnreadCount(req.user.id);
    res.status(200).json({ success: true, data: { unreadCount: count } });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    const n = await notificationModel.markAllRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked read', data: { updated: n } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMyNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
  getUnreadCount,
  markAllRead,
};
