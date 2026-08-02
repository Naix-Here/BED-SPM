// models/inspectionModel.js — CRUD for the Inspection table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllInspections(stallId, officerId) {
  await poolConnect;
  const request = pool.request();
  const conditions = [];
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    conditions.push('i.StallId = @StallId');
  }
  if (officerId) {
    request.input('OfficerId', sql.Int, officerId);
    conditions.push('i.OfficerId = @OfficerId');
  }
  let query = `
    SELECT i.InspectionId, i.StallId, i.OfficerId, i.InspectionDate, i.Score,
           i.Remarks, i.GradeIssued, i.CreatedAt,
           s.Name AS StallName,
           u.FullName AS OfficerName
    FROM Inspection i
    JOIN Stall s ON i.StallId = s.StallId
    JOIN [User] u ON i.OfficerId = u.UserId
  `;
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY i.InspectionDate DESC, i.InspectionId DESC';
  const result = await request.query(query);
  return result.recordset;
}

async function getInspectionById(inspectionId) {
  await poolConnect;
  const request = pool.request();
  request.input('InspectionId', sql.Int, inspectionId);
  const result = await request.query(`
    SELECT i.InspectionId, i.StallId, i.OfficerId, i.InspectionDate, i.Score,
           i.Remarks, i.GradeIssued, i.CreatedAt,
           s.Name AS StallName,
           u.FullName AS OfficerName
    FROM Inspection i
    JOIN Stall s ON i.StallId = s.StallId
    JOIN [User] u ON i.OfficerId = u.UserId
    WHERE i.InspectionId = @InspectionId
  `);
  return result.recordset[0] || null;
}

async function createInspection(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('OfficerId', sql.Int, data.officerId);
  request.input('InspectionDate', sql.Date, data.inspectionDate);
  request.input('Score', sql.Decimal(5, 2), data.score);
  request.input('Remarks', sql.NVarChar(2000), data.remarks || null);
  request.input('GradeIssued', sql.NChar(1), data.gradeIssued);
  const result = await request.query(`
    INSERT INTO Inspection (StallId, OfficerId, InspectionDate, Score, Remarks, GradeIssued)
    OUTPUT INSERTED.*
    VALUES (@StallId, @OfficerId, @InspectionDate, @Score, @Remarks, @GradeIssued)
  `);
  return result.recordset[0];
}

async function updateInspection(inspectionId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('InspectionId', sql.Int, inspectionId);
  request.input('InspectionDate', sql.Date, data.inspectionDate);
  request.input('Score', sql.Decimal(5, 2), data.score);
  request.input('Remarks', sql.NVarChar(2000), data.remarks || null);
  request.input('GradeIssued', sql.NChar(1), data.gradeIssued);
  const result = await request.query(`
    UPDATE Inspection
    SET InspectionDate = @InspectionDate, Score = @Score,
        Remarks = @Remarks, GradeIssued = @GradeIssued
    OUTPUT INSERTED.*
    WHERE InspectionId = @InspectionId
  `);
  return result.recordset[0] || null;
}

async function deleteInspection(inspectionId) {
  await poolConnect;
  const request = pool.request();
  request.input('InspectionId', sql.Int, inspectionId);
  const result = await request.query('DELETE FROM Inspection WHERE InspectionId = @InspectionId');
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
  getAllInspections,
  getInspectionById,
  createInspection,
  updateInspection,
  deleteInspection,
  stallExists,
};
