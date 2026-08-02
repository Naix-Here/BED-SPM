// models/notificationModel.js — CRUD for the Notification table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllNotifications(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  const result = await request.query(`
    SELECT NotificationId, UserId, Title, Message, Type, IsRead, CreatedAt
    FROM Notification
    WHERE UserId = @UserId
    ORDER BY CreatedAt DESC
  `);
  return result.recordset;
}

async function getNotificationById(notificationId) {
  await poolConnect;
  const request = pool.request();
  request.input('NotificationId', sql.Int, notificationId);
  const result = await request.query(`
    SELECT NotificationId, UserId, Title, Message, Type, IsRead, CreatedAt
    FROM Notification
    WHERE NotificationId = @NotificationId
  `);
  return result.recordset[0] || null;
}

async function createNotification(data) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, data.userId);
  request.input('Title', sql.NVarChar(200), data.title);
  request.input('Message', sql.NVarChar(1000), data.message);
  request.input('Type', sql.NVarChar(50), data.type);
  request.input('IsRead', sql.Bit, data.isRead ? 1 : 0);
  const result = await request.query(`
    INSERT INTO Notification (UserId, Title, Message, Type, IsRead)
    OUTPUT INSERTED.*
    VALUES (@UserId, @Title, @Message, @Type, @IsRead)
  `);
  return result.recordset[0];
}

async function updateNotification(notificationId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('NotificationId', sql.Int, notificationId);
  request.input('IsRead', sql.Bit, data.isRead ? 1 : 0);
  const result = await request.query(`
    UPDATE Notification
    SET IsRead = @IsRead
    OUTPUT INSERTED.*
    WHERE NotificationId = @NotificationId
  `);
  return result.recordset[0] || null;
}

async function markAllRead(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  const result = await request.query(`
    UPDATE Notification SET IsRead = 1
    WHERE UserId = @UserId AND IsRead = 0
  `);
  return result.rowsAffected[0];
}

async function getUnreadCount(userId) {
  await poolConnect;
  const request = pool.request();
  request.input('UserId', sql.Int, userId);
  const result = await request.query(`
    SELECT COUNT(*) AS UnreadCount
    FROM Notification
    WHERE UserId = @UserId AND IsRead = 0
  `);
  return result.recordset[0].UnreadCount;
}

async function deleteNotification(notificationId) {
  await poolConnect;
  const request = pool.request();
  request.input('NotificationId', sql.Int, notificationId);
  const result = await request.query('DELETE FROM Notification WHERE NotificationId = @NotificationId');
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  markAllRead,
  getUnreadCount,
  deleteNotification,
};
