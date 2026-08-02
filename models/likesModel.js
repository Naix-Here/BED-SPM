// models/likesModel.js — CRUD for the Likes table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllLikes(menuItemId, customerId) {
  await poolConnect;
  const request = pool.request();
  const conditions = [];
  if (menuItemId) {
    request.input('MenuItemId', sql.Int, menuItemId);
    conditions.push('l.MenuItemId = @MenuItemId');
  }
  if (customerId) {
    request.input('CustomerId', sql.Int, customerId);
    conditions.push('l.CustomerId = @CustomerId');
  }
  let query = `
    SELECT l.LikeId, l.MenuItemId, l.CustomerId, l.CreatedAt,
           u.FullName AS CustomerName,
           m.Name AS MenuItemName, m.StallId,
           s.Name AS StallName
    FROM Likes l
    JOIN [User] u ON l.CustomerId = u.UserId
    JOIN MenuItem m ON l.MenuItemId = m.MenuItemId
    JOIN Stall s ON m.StallId = s.StallId
  `;
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY l.CreatedAt DESC';
  const result = await request.query(query);
  return result.recordset;
}

async function getLikeById(likeId) {
  await poolConnect;
  const request = pool.request();
  request.input('LikeId', sql.Int, likeId);
  const result = await request.query(`
    SELECT l.LikeId, l.MenuItemId, l.CustomerId, l.CreatedAt,
           u.FullName AS CustomerName,
           m.Name AS MenuItemName, m.StallId
    FROM Likes l
    JOIN [User] u ON l.CustomerId = u.UserId
    JOIN MenuItem m ON l.MenuItemId = m.MenuItemId
    WHERE l.LikeId = @LikeId
  `);
  return result.recordset[0] || null;
}

async function createLike(data) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, data.menuItemId);
  request.input('CustomerId', sql.Int, data.customerId);
  const result = await request.query(`
    INSERT INTO Likes (MenuItemId, CustomerId)
    OUTPUT INSERTED.*
    VALUES (@MenuItemId, @CustomerId)
  `);
  return result.recordset[0];
}

async function deleteLike(likeId) {
  await poolConnect;
  const request = pool.request();
  request.input('LikeId', sql.Int, likeId);
  const result = await request.query('DELETE FROM Likes WHERE LikeId = @LikeId');
  return result.rowsAffected[0] > 0;
}

async function getLikeCountForMenuItem(menuItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  const result = await request.query(
    'SELECT COUNT(*) AS LikeCount FROM Likes WHERE MenuItemId = @MenuItemId'
  );
  return result.recordset[0].LikeCount;
}

async function findLikeByMenuAndCustomer(menuItemId, customerId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  request.input('CustomerId', sql.Int, customerId);
  const result = await request.query(`
    SELECT * FROM Likes
    WHERE MenuItemId = @MenuItemId AND CustomerId = @CustomerId
  `);
  return result.recordset[0] || null;
}

async function menuItemExists(menuItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  const result = await request.query('SELECT 1 AS ExistsRow FROM MenuItem WHERE MenuItemId = @MenuItemId');
  return result.recordset.length > 0;
}

module.exports = {
  getAllLikes,
  getLikeById,
  createLike,
  deleteLike,
  getLikeCountForMenuItem,
  findLikeByMenuAndCustomer,
  menuItemExists,
};
