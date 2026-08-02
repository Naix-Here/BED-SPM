// models/hygieneGradeModel.js — CRUD for the HygieneGrade table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllHygieneGrades(stallId) {
  await poolConnect;
  const request = pool.request();
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    const result = await request.query(`
      SELECT h.HygieneGradeId, h.StallId, h.Grade, h.IssuedDate, h.ExpiryDate,
             h.InspectionId, h.CreatedAt,
             s.Name AS StallName,
             i.Score AS InspectionScore, i.Remarks AS InspectionRemarks
      FROM HygieneGrade h
      JOIN Stall s ON h.StallId = s.StallId
      LEFT JOIN Inspection i ON h.InspectionId = i.InspectionId
      WHERE h.StallId = @StallId
      ORDER BY h.IssuedDate DESC
    `);
    return result.recordset;
  }
  const result = await request.query(`
    SELECT h.HygieneGradeId, h.StallId, h.Grade, h.IssuedDate, h.ExpiryDate,
           h.InspectionId, h.CreatedAt,
           s.Name AS StallName,
           i.Score AS InspectionScore, i.Remarks AS InspectionRemarks
    FROM HygieneGrade h
    JOIN Stall s ON h.StallId = s.StallId
    LEFT JOIN Inspection i ON h.InspectionId = i.InspectionId
    ORDER BY h.IssuedDate DESC
  `);
  return result.recordset;
}

async function getHygieneGradeById(hygieneGradeId) {
  await poolConnect;
  const request = pool.request();
  request.input('HygieneGradeId', sql.Int, hygieneGradeId);
  const result = await request.query(`
    SELECT h.HygieneGradeId, h.StallId, h.Grade, h.IssuedDate, h.ExpiryDate,
           h.InspectionId, h.CreatedAt,
           s.Name AS StallName,
           i.Score AS InspectionScore, i.Remarks AS InspectionRemarks
    FROM HygieneGrade h
    JOIN Stall s ON h.StallId = s.StallId
    LEFT JOIN Inspection i ON h.InspectionId = i.InspectionId
    WHERE h.HygieneGradeId = @HygieneGradeId
  `);
  return result.recordset[0] || null;
}

async function getHistoryForStall(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query(`
    SELECT h.HygieneGradeId, h.StallId, h.Grade, h.IssuedDate, h.ExpiryDate,
           h.InspectionId, h.CreatedAt,
           i.Score AS InspectionScore, i.Remarks AS InspectionRemarks
    FROM HygieneGrade h
    LEFT JOIN Inspection i ON h.InspectionId = i.InspectionId
    WHERE h.StallId = @StallId
    ORDER BY h.IssuedDate DESC
  `);
  return result.recordset;
}

async function createHygieneGrade(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('Grade', sql.NChar(1), data.grade);
  request.input('IssuedDate', sql.Date, data.issuedDate);
  request.input('ExpiryDate', sql.Date, data.expiryDate);
  request.input('InspectionId', sql.Int, data.inspectionId || null);
  const result = await request.query(`
    INSERT INTO HygieneGrade (StallId, Grade, IssuedDate, ExpiryDate, InspectionId)
    OUTPUT INSERTED.*
    VALUES (@StallId, @Grade, @IssuedDate, @ExpiryDate, @InspectionId)
  `);
  return result.recordset[0];
}

async function updateHygieneGrade(hygieneGradeId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('HygieneGradeId', sql.Int, hygieneGradeId);
  request.input('Grade', sql.NChar(1), data.grade);
  request.input('IssuedDate', sql.Date, data.issuedDate);
  request.input('ExpiryDate', sql.Date, data.expiryDate);
  request.input('InspectionId', sql.Int, data.inspectionId || null);
  const result = await request.query(`
    UPDATE HygieneGrade
    SET Grade = @Grade, IssuedDate = @IssuedDate, ExpiryDate = @ExpiryDate, InspectionId = @InspectionId
    OUTPUT INSERTED.*
    WHERE HygieneGradeId = @HygieneGradeId
  `);
  return result.recordset[0] || null;
}

async function deleteHygieneGrade(hygieneGradeId) {
  await poolConnect;
  const request = pool.request();
  request.input('HygieneGradeId', sql.Int, hygieneGradeId);
  const result = await request.query('DELETE FROM HygieneGrade WHERE HygieneGradeId = @HygieneGradeId');
  return result.rowsAffected[0] > 0;
}

async function stallExists(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query('SELECT 1 AS ExistsRow FROM Stall WHERE StallId = @StallId');
  return result.recordset.length > 0;
}

async function inspectionExists(inspectionId) {
  await poolConnect;
  const request = pool.request();
  request.input('InspectionId', sql.Int, inspectionId);
  const result = await request.query('SELECT 1 AS ExistsRow FROM Inspection WHERE InspectionId = @InspectionId');
  return result.recordset.length > 0;
}

module.exports = {
  getAllHygieneGrades,
  getHygieneGradeById,
  getHistoryForStall,
  createHygieneGrade,
  updateHygieneGrade,
  deleteHygieneGrade,
  stallExists,
  inspectionExists,
};
