// models/stallModel.js — CRUD for the Stall table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllStalls(hawkerCentreId) {
  await poolConnect;
  const request = pool.request();
  let query = `
    SELECT s.StallId, s.HawkerCentreId, s.OwnerId, s.Name, s.Description, s.UnitNumber,
           s.ImageUrl, s.Status, s.CreatedAt,
           u.FullName AS OwnerName, u.Email AS OwnerEmail,
           hc.Name AS HawkerCentreName, hc.Address AS HawkerCentreAddress,
           (SELECT TOP 1 Grade FROM HygieneGrade hg
            WHERE hg.StallId = s.StallId AND hg.ExpiryDate >= CAST(GETDATE() AS DATE)
            ORDER BY hg.IssuedDate DESC) AS CurrentHygieneGrade
    FROM Stall s
    JOIN [User] u ON s.OwnerId = u.UserId
    JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
  `;
  if (hawkerCentreId) {
    request.input('HawkerCentreId', sql.Int, hawkerCentreId);
    query += ' WHERE s.HawkerCentreId = @HawkerCentreId';
  }
  query += ' ORDER BY s.Name';
  const result = await request.query(query);
  return result.recordset;
}

async function getStallById(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query(`
    SELECT s.StallId, s.HawkerCentreId, s.OwnerId, s.Name, s.Description, s.UnitNumber,
           s.ImageUrl, s.Status, s.CreatedAt,
           u.FullName AS OwnerName, u.Email AS OwnerEmail,
           hc.Name AS HawkerCentreName, hc.Address AS HawkerCentreAddress,
           (SELECT TOP 1 Grade FROM HygieneGrade hg
            WHERE hg.StallId = s.StallId AND hg.ExpiryDate >= CAST(GETDATE() AS DATE)
            ORDER BY hg.IssuedDate DESC) AS CurrentHygieneGrade
    FROM Stall s
    JOIN [User] u ON s.OwnerId = u.UserId
    JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
    WHERE s.StallId = @StallId
  `);
  return result.recordset[0] || null;
}

async function getStallsByOwnerId(ownerId) {
  await poolConnect;
  const request = pool.request();
  request.input('OwnerId', sql.Int, ownerId);
  const result = await request.query(`
    SELECT s.StallId, s.HawkerCentreId, s.OwnerId, s.Name, s.Description, s.UnitNumber,
           s.ImageUrl, s.Status, s.CreatedAt,
           hc.Name AS HawkerCentreName,
           (SELECT TOP 1 Grade FROM HygieneGrade hg
            WHERE hg.StallId = s.StallId AND hg.ExpiryDate >= CAST(GETDATE() AS DATE)
            ORDER BY hg.IssuedDate DESC) AS CurrentHygieneGrade
    FROM Stall s
    JOIN HawkerCentre hc ON s.HawkerCentreId = hc.HawkerCentreId
    WHERE s.OwnerId = @OwnerId
    ORDER BY s.Name
  `);
  return result.recordset;
}

async function getCuisinesForStall(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query(`
    SELECT DISTINCT c.CuisineId, c.Name
    FROM Cuisine c
    JOIN MenuItemCuisine mic ON c.CuisineId = mic.CuisineId
    JOIN MenuItem m ON mic.MenuItemId = m.MenuItemId
    WHERE m.StallId = @StallId
    ORDER BY c.Name
  `);
  return result.recordset;
}

async function createStall(data) {
  await poolConnect;
  const request = pool.request();
  request.input('HawkerCentreId', sql.Int, data.hawkerCentreId);
  request.input('OwnerId', sql.Int, data.ownerId);
  request.input('Name', sql.NVarChar(100), data.name);
  request.input('Description', sql.NVarChar(500), data.description || null);
  request.input('UnitNumber', sql.NVarChar(20), data.unitNumber);
  request.input('ImageUrl', sql.NVarChar(500), data.imageUrl || null);
  request.input('Status', sql.NVarChar(20), data.status || 'Active');
  const result = await request.query(`
    INSERT INTO Stall (HawkerCentreId, OwnerId, Name, Description, UnitNumber, ImageUrl, Status)
    OUTPUT INSERTED.*
    VALUES (@HawkerCentreId, @OwnerId, @Name, @Description, @UnitNumber, @ImageUrl, @Status)
  `);
  return result.recordset[0];
}

async function updateStall(stallId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  request.input('Name', sql.NVarChar(100), data.name);
  request.input('Description', sql.NVarChar(500), data.description || null);
  request.input('UnitNumber', sql.NVarChar(20), data.unitNumber);
  const imageUrl = data.imageUrl !== undefined ? data.imageUrl : data.ImageUrl;
  request.input('ImageUrl', sql.NVarChar(500), imageUrl || null);
  request.input('Status', sql.NVarChar(20), data.status || 'Active');
  const result = await request.query(`
    UPDATE Stall
    SET Name = @Name, Description = @Description, UnitNumber = @UnitNumber,
        ImageUrl = @ImageUrl, Status = @Status
    OUTPUT INSERTED.*
    WHERE StallId = @StallId
  `);
  return result.recordset[0] || null;
}

async function deleteStall(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query('DELETE FROM Stall WHERE StallId = @StallId');
  return result.rowsAffected[0] > 0;
}

async function isStallOwner(stallId, userId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  request.input('UserId', sql.Int, userId);
  const result = await request.query(
    'SELECT 1 AS Owned FROM Stall WHERE StallId = @StallId AND OwnerId = @UserId'
  );
  return result.recordset.length > 0;
}

async function getStallPerformance(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);

  const orderAgg = await request.query(`
    SELECT
      COUNT(*) AS totalOrders,
      SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS pendingOrders,
      SUM(CASE WHEN Status = 'Preparing' THEN 1 ELSE 0 END) AS preparingOrders,
      SUM(CASE WHEN Status = 'Ready' THEN 1 ELSE 0 END) AS readyOrders,
      SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS completedOrders,
      SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) AS cancelledOrders,
      ISNULL(SUM(CASE WHEN Status = 'Completed' THEN TotalAmount ELSE 0 END), 0) AS revenue
    FROM [Order]
    WHERE StallId = @StallId
  `);

  const feedbackAgg = await request.query(`
    SELECT
      COUNT(*) AS totalFeedback,
      ISNULL(AVG(CAST(Rating AS FLOAT)), 0) AS averageRating
    FROM Feedback
    WHERE StallId = @StallId
  `);

  const likeAgg = await request.query(`
    SELECT COUNT(*) AS totalLikes
    FROM Likes l
    JOIN MenuItem m ON l.MenuItemId = m.MenuItemId
    WHERE m.StallId = @StallId
  `);

  const gradeRes = await request.query(`
    SELECT TOP 1 Grade AS currentHygieneGrade
    FROM HygieneGrade
    WHERE StallId = @StallId AND ExpiryDate >= CAST(GETDATE() AS DATE)
    ORDER BY IssuedDate DESC
  `);

  const o = orderAgg.recordset[0] || {};
  const f = feedbackAgg.recordset[0] || {};
  const l = likeAgg.recordset[0] || {};
  const g = gradeRes.recordset[0] || {};

  return {
    totalOrders: Number(o.totalOrders) || 0,
    pendingOrders: Number(o.pendingOrders) || 0,
    preparingOrders: Number(o.preparingOrders) || 0,
    readyOrders: Number(o.readyOrders) || 0,
    completedOrders: Number(o.completedOrders) || 0,
    cancelledOrders: Number(o.cancelledOrders) || 0,
    revenue: Number(o.revenue) || 0,
    averageRating: Number(f.averageRating) || 0,
    totalFeedback: Number(f.totalFeedback) || 0,
    totalLikes: Number(l.totalLikes) || 0,
    currentHygieneGrade: g.currentHygieneGrade || null,
  };
}

module.exports = {
  getAllStalls,
  getStallById,
  getStallsByOwnerId,
  getCuisinesForStall,
  createStall,
  updateStall,
  deleteStall,
  isStallOwner,
  getStallPerformance,
};
