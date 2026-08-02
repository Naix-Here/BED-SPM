// models/feedbackModel.js — CRUD for the Feedback table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllFeedback(stallId) {
  await poolConnect;
  const request = pool.request();
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    const result = await request.query(`
      SELECT f.FeedbackId, f.StallId, f.CustomerId, f.Rating, f.Comment, f.CreatedAt,
             u.FullName AS CustomerName, s.Name AS StallName
      FROM Feedback f
      JOIN [User] u ON f.CustomerId = u.UserId
      JOIN Stall s ON f.StallId = s.StallId
      WHERE f.StallId = @StallId
      ORDER BY f.CreatedAt DESC
    `);
    return result.recordset;
  }
  const result = await request.query(`
    SELECT f.FeedbackId, f.StallId, f.CustomerId, f.Rating, f.Comment, f.CreatedAt,
           u.FullName AS CustomerName, s.Name AS StallName
    FROM Feedback f
    JOIN [User] u ON f.CustomerId = u.UserId
    JOIN Stall s ON f.StallId = s.StallId
    ORDER BY f.CreatedAt DESC
  `);
  return result.recordset;
}

async function getFeedbackById(feedbackId) {
  await poolConnect;
  const request = pool.request();
  request.input('FeedbackId', sql.Int, feedbackId);
  const result = await request.query(`
    SELECT f.FeedbackId, f.StallId, f.CustomerId, f.Rating, f.Comment, f.CreatedAt,
           u.FullName AS CustomerName, s.Name AS StallName
    FROM Feedback f
    JOIN [User] u ON f.CustomerId = u.UserId
    JOIN Stall s ON f.StallId = s.StallId
    WHERE f.FeedbackId = @FeedbackId
  `);
  return result.recordset[0] || null;
}

async function createFeedback(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('CustomerId', sql.Int, data.customerId);
  request.input('Rating', sql.Int, data.rating);
  request.input('Comment', sql.NVarChar(1000), data.comment || null);
  const result = await request.query(`
    INSERT INTO Feedback (StallId, CustomerId, Rating, Comment)
    OUTPUT INSERTED.*
    VALUES (@StallId, @CustomerId, @Rating, @Comment)
  `);
  return result.recordset[0];
}

async function updateFeedback(feedbackId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('FeedbackId', sql.Int, feedbackId);
  request.input('Rating', sql.Int, data.rating);
  request.input('Comment', sql.NVarChar(1000), data.comment || null);
  const result = await request.query(`
    UPDATE Feedback
    SET Rating = @Rating, Comment = @Comment
    OUTPUT INSERTED.*
    WHERE FeedbackId = @FeedbackId
  `);
  return result.recordset[0] || null;
}

async function deleteFeedback(feedbackId) {
  await poolConnect;
  const request = pool.request();
  request.input('FeedbackId', sql.Int, feedbackId);
  const result = await request.query('DELETE FROM Feedback WHERE FeedbackId = @FeedbackId');
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
  getAllFeedback,
  getFeedbackById,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  stallExists,
};
