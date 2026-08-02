// models/complaintModel.js — CRUD for the Complaint table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllComplaints(filters = {}) {
  await poolConnect;
  const request = pool.request();
  const conditions = [];
  if (filters.stallId) {
    request.input('StallId', sql.Int, filters.stallId);
    conditions.push('c.StallId = @StallId');
  }
  if (filters.customerId) {
    request.input('CustomerId', sql.Int, filters.customerId);
    conditions.push('c.CustomerId = @CustomerId');
  }
  if (filters.status) {
    request.input('Status', sql.NVarChar(20), filters.status);
    conditions.push('c.Status = @Status');
  }
  let query = `
    SELECT c.ComplaintId, c.StallId, c.CustomerId, c.Subject, c.Description,
           c.Status, c.CreatedAt,
           u.FullName AS CustomerName,
           s.Name AS StallName, s.OwnerId
    FROM Complaint c
    JOIN [User] u ON c.CustomerId = u.UserId
    JOIN Stall s ON c.StallId = s.StallId
  `;
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY c.CreatedAt DESC';
  const result = await request.query(query);
  return result.recordset;
}

async function getComplaintById(complaintId) {
  await poolConnect;
  const request = pool.request();
  request.input('ComplaintId', sql.Int, complaintId);
  const result = await request.query(`
    SELECT c.ComplaintId, c.StallId, c.CustomerId, c.Subject, c.Description,
           c.Status, c.CreatedAt,
           u.FullName AS CustomerName,
           s.Name AS StallName, s.OwnerId
    FROM Complaint c
    JOIN [User] u ON c.CustomerId = u.UserId
    JOIN Stall s ON c.StallId = s.StallId
    WHERE c.ComplaintId = @ComplaintId
  `);
  return result.recordset[0] || null;
}

async function createComplaint(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('CustomerId', sql.Int, data.customerId);
  request.input('Subject', sql.NVarChar(200), data.subject);
  request.input('Description', sql.NVarChar(2000), data.description);
  request.input('Status', sql.NVarChar(20), data.status || 'Open');
  const result = await request.query(`
    INSERT INTO Complaint (StallId, CustomerId, Subject, Description, Status)
    OUTPUT INSERTED.*
    VALUES (@StallId, @CustomerId, @Subject, @Description, @Status)
  `);
  return result.recordset[0];
}

async function updateComplaint(complaintId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('ComplaintId', sql.Int, complaintId);
  request.input('Status', sql.NVarChar(20), data.status);
  const result = await request.query(`
    UPDATE Complaint
    SET Status = @Status
    OUTPUT INSERTED.*
    WHERE ComplaintId = @ComplaintId
  `);
  return result.recordset[0] || null;
}

async function deleteComplaint(complaintId) {
  await poolConnect;
  const request = pool.request();
  request.input('ComplaintId', sql.Int, complaintId);
  const result = await request.query('DELETE FROM Complaint WHERE ComplaintId = @ComplaintId');
  return result.rowsAffected[0] > 0;
}

async function stallExists(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query('SELECT 1 AS ExistsRow FROM Stall WHERE StallId = @StallId');
  return result.recordset.length > 0;
}

module.exports = {
  getAllComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  stallExists,
};
