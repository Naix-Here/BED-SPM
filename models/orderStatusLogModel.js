// models/orderStatusLogModel.js — CRUD for the OrderStatusLog table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllLogs(orderId) {
  await poolConnect;
  const request = pool.request();
  if (orderId) {
    request.input('OrderId', sql.Int, orderId);
    const result = await request.query(`
      SELECT l.LogId, l.OrderId, l.Status, l.ChangedAt, l.ChangedBy,
             u.FullName AS ChangedByName
      FROM OrderStatusLog l
      LEFT JOIN [User] u ON l.ChangedBy = u.UserId
      WHERE l.OrderId = @OrderId
      ORDER BY l.ChangedAt ASC
    `);
    return result.recordset;
  }
  const result = await request.query(`
    SELECT l.LogId, l.OrderId, l.Status, l.ChangedAt, l.ChangedBy,
           u.FullName AS ChangedByName
    FROM OrderStatusLog l
    LEFT JOIN [User] u ON l.ChangedBy = u.UserId
    ORDER BY l.ChangedAt ASC
  `);
  return result.recordset;
}

async function getLogById(logId) {
  await poolConnect;
  const request = pool.request();
  request.input('LogId', sql.Int, logId);
  const result = await request.query(`
    SELECT l.LogId, l.OrderId, l.Status, l.ChangedAt, l.ChangedBy,
           u.FullName AS ChangedByName
    FROM OrderStatusLog l
    LEFT JOIN [User] u ON l.ChangedBy = u.UserId
    WHERE l.LogId = @LogId
  `);
  return result.recordset[0] || null;
}

async function getHistoryForOrder(orderId) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, orderId);
  const result = await request.query(`
    SELECT l.LogId, l.OrderId, l.Status, l.ChangedAt, l.ChangedBy,
           u.FullName AS ChangedByName
    FROM OrderStatusLog l
    LEFT JOIN [User] u ON l.ChangedBy = u.UserId
    WHERE l.OrderId = @OrderId
    ORDER BY l.ChangedAt ASC
  `);
  return result.recordset;
}

async function createLog(data) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, data.orderId);
  request.input('Status', sql.NVarChar(20), data.status);
  request.input('ChangedBy', sql.Int, data.changedBy || null);
  const result = await request.query(`
    INSERT INTO OrderStatusLog (OrderId, Status, ChangedBy)
    OUTPUT INSERTED.*
    VALUES (@OrderId, @Status, @ChangedBy)
  `);
  return result.recordset[0];
}

async function updateLog(logId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('LogId', sql.Int, logId);
  request.input('Status', sql.NVarChar(20), data.status);
  const result = await request.query(`
    UPDATE OrderStatusLog
    SET Status = @Status
    OUTPUT INSERTED.*
    WHERE LogId = @LogId
  `);
  return result.recordset[0] || null;
}

async function deleteLog(logId) {
  await poolConnect;
  const request = pool.request();
  request.input('LogId', sql.Int, logId);
  const result = await request.query('DELETE FROM OrderStatusLog WHERE LogId = @LogId');
  return result.rowsAffected[0] > 0;
}

async function orderExists(orderId) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, orderId);
  const result = await request.query('SELECT 1 AS ExistsRow FROM [Order] WHERE OrderId = @OrderId');
  return result.recordset.length > 0;
}

module.exports = {
  getAllLogs,
  getLogById,
  getHistoryForOrder,
  createLog,
  updateLog,
  deleteLog,
  orderExists,
};
