// models/queueModel.js — CRUD for the QueueEntry table (digital queue).
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllQueueEntries(stallId, status) {
  await poolConnect;
  const request = pool.request();
  const conditions = [];
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    conditions.push('q.StallId = @StallId');
  }
  if (status) {
    request.input('Status', sql.NVarChar(20), status);
    conditions.push('q.Status = @Status');
  }
  let query = `
    SELECT q.QueueEntryId, q.StallId, q.CustomerId, q.QueueNumber, q.Status, q.JoinedAt,
           u.FullName AS CustomerName,
           s.Name AS StallName
    FROM QueueEntry q
    JOIN [User] u ON q.CustomerId = u.UserId
    JOIN Stall s ON q.StallId = s.StallId
  `;
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY q.QueueNumber ASC, q.JoinedAt ASC';
  const result = await request.query(query);
  return result.recordset;
}

async function getQueueEntryById(queueEntryId) {
  await poolConnect;
  const request = pool.request();
  request.input('QueueEntryId', sql.Int, queueEntryId);
  const result = await request.query(`
    SELECT q.QueueEntryId, q.StallId, q.CustomerId, q.QueueNumber, q.Status, q.JoinedAt,
           u.FullName AS CustomerName,
           s.Name AS StallName
    FROM QueueEntry q
    JOIN [User] u ON q.CustomerId = u.UserId
    JOIN Stall s ON q.StallId = s.StallId
    WHERE q.QueueEntryId = @QueueEntryId
  `);
  return result.recordset[0] || null;
}

async function getNextQueueNumber(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query(`
    SELECT ISNULL(MAX(QueueNumber), 0) + 1 AS NextNumber
    FROM QueueEntry
    WHERE StallId = @StallId
  `);
  return result.recordset[0].NextNumber;
}

async function createQueueEntry(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('CustomerId', sql.Int, data.customerId);
  request.input('QueueNumber', sql.Int, data.queueNumber);
  request.input('Status', sql.NVarChar(20), data.status || 'Waiting');
  const result = await request.query(`
    INSERT INTO QueueEntry (StallId, CustomerId, QueueNumber, Status)
    OUTPUT INSERTED.*
    VALUES (@StallId, @CustomerId, @QueueNumber, @Status)
  `);
  return result.recordset[0];
}

async function updateQueueEntry(queueEntryId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('QueueEntryId', sql.Int, queueEntryId);
  request.input('Status', sql.NVarChar(20), data.status);
  const result = await request.query(`
    UPDATE QueueEntry
    SET Status = @Status
    OUTPUT INSERTED.*
    WHERE QueueEntryId = @QueueEntryId
  `);
  return result.recordset[0] || null;
}

async function deleteQueueEntry(queueEntryId) {
  await poolConnect;
  const request = pool.request();
  request.input('QueueEntryId', sql.Int, queueEntryId);
  const result = await request.query('DELETE FROM QueueEntry WHERE QueueEntryId = @QueueEntryId');
  return result.rowsAffected[0] > 0;
}

async function getPositionForCustomer(stallId, customerId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  request.input('CustomerId', sql.Int, customerId);
  const result = await request.query(`
    SELECT q.QueueEntryId, q.QueueNumber, q.Status, q.JoinedAt,
           (SELECT COUNT(*) FROM QueueEntry q2
            WHERE q2.StallId = q.StallId
              AND q2.Status = 'Waiting'
              AND q2.QueueNumber <= q.QueueNumber) AS Position,
           (SELECT COUNT(*) FROM QueueEntry q3
            WHERE q3.StallId = q.StallId AND q3.Status = 'Waiting') AS TotalWaiting
    FROM QueueEntry q
    WHERE q.StallId = @StallId AND q.CustomerId = @CustomerId
    ORDER BY q.JoinedAt DESC
  `);
  return result.recordset[0] || null;
}

async function getStallQueueStatus(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query(`
    SELECT
      SUM(CASE WHEN Status = 'Waiting'   THEN 1 ELSE 0 END) AS WaitingCount,
      SUM(CASE WHEN Status = 'Served'    THEN 1 ELSE 0 END) AS ServedCount,
      SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledCount,
      ISNULL(MAX(CASE WHEN Status = 'Waiting' THEN QueueNumber ELSE 0 END), 0) AS HighestQueueNumber,
      ISNULL(MIN(CASE WHEN Status = 'Waiting' THEN QueueNumber ELSE NULL END), NULL) AS NextQueueNumber
    FROM QueueEntry
    WHERE StallId = @StallId
  `);
  return result.recordset[0];
}

async function stallExists(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query('SELECT 1 AS ExistsRow FROM Stall WHERE StallId = @StallId');
  return result.recordset.length > 0;
}

module.exports = {
  getAllQueueEntries,
  getQueueEntryById,
  getNextQueueNumber,
  createQueueEntry,
  updateQueueEntry,
  deleteQueueEntry,
  getPositionForCustomer,
  getStallQueueStatus,
  stallExists,
};
