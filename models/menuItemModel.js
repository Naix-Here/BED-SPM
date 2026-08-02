// models/menuItemModel.js — CRUD for the MenuItem table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllMenuItems(stallId) {
  await poolConnect;
  const request = pool.request();
  let query = `
    SELECT m.MenuItemId, m.StallId, m.Name, m.Description, m.Price, m.Category,
           m.IsAvailable, m.CreatedAt,
           s.Name AS StallName, s.OwnerId, s.HawkerCentreId,
           (
             SELECT STRING_AGG(c.Name, ', ')
             FROM MenuItemCuisine mic
             JOIN Cuisine c ON mic.CuisineId = c.CuisineId
             WHERE mic.MenuItemId = m.MenuItemId
           ) AS CuisineNames,
           (
             SELECT COUNT(*) FROM Likes l WHERE l.MenuItemId = m.MenuItemId
           ) AS LikeCount
    FROM MenuItem m
    JOIN Stall s ON m.StallId = s.StallId
  `;
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    query += ' WHERE m.StallId = @StallId';
  }
  query += ' ORDER BY m.Category, m.Name';
  const result = await request.query(query);
  return result.recordset;
}

async function getMenuItemById(menuItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  const result = await request.query(`
    SELECT m.MenuItemId, m.StallId, m.Name, m.Description, m.Price, m.Category,
           m.IsAvailable, m.CreatedAt,
           s.Name AS StallName, s.OwnerId, s.HawkerCentreId,
           (
             SELECT COUNT(*) FROM Likes l WHERE l.MenuItemId = m.MenuItemId
           ) AS LikeCount
    FROM MenuItem m
    JOIN Stall s ON m.StallId = s.StallId
    WHERE m.MenuItemId = @MenuItemId
  `);
  return result.recordset[0] || null;
}

async function getCuisineIdsForMenuItem(menuItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  const result = await request.query(`
    SELECT CuisineId FROM MenuItemCuisine WHERE MenuItemId = @MenuItemId
  `);
  return result.recordset.map((r) => r.CuisineId);
}

async function getCuisinesForMenuItem(menuItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  const result = await request.query(`
    SELECT c.CuisineId, c.Name
    FROM Cuisine c
    JOIN MenuItemCuisine mic ON c.CuisineId = mic.CuisineId
    WHERE mic.MenuItemId = @MenuItemId
    ORDER BY c.Name
  `);
  return result.recordset;
}

async function createMenuItem(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('Name', sql.NVarChar(100), data.name);
  request.input('Description', sql.NVarChar(500), data.description || null);
  request.input('Price', sql.Decimal(10, 2), data.price);
  request.input('Category', sql.NVarChar(50), data.category);
  request.input('IsAvailable', sql.Bit, data.isAvailable === false ? 0 : 1);
  const result = await request.query(`
    INSERT INTO MenuItem (StallId, Name, Description, Price, Category, IsAvailable)
    OUTPUT INSERTED.*
    VALUES (@StallId, @Name, @Description, @Price, @Category, @IsAvailable)
  `);
  return result.recordset[0];
}

async function updateMenuItem(menuItemId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  request.input('Name', sql.NVarChar(100), data.name);
  request.input('Description', sql.NVarChar(500), data.description || null);
  request.input('Price', sql.Decimal(10, 2), data.price);
  request.input('Category', sql.NVarChar(50), data.category);
  request.input('IsAvailable', sql.Bit, data.isAvailable === false ? 0 : 1);
  const result = await request.query(`
    UPDATE MenuItem
    SET Name = @Name, Description = @Description, Price = @Price, Category = @Category, IsAvailable = @IsAvailable
    OUTPUT INSERTED.*
    WHERE MenuItemId = @MenuItemId
  `);
  return result.recordset[0] || null;
}

async function deleteMenuItem(menuItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  await request.query('DELETE FROM MenuItemCuisine WHERE MenuItemId = @MenuItemId');
  await request.query('DELETE FROM Likes WHERE MenuItemId = @MenuItemId');
  const result = await request.query('DELETE FROM MenuItem WHERE MenuItemId = @MenuItemId');
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  getCuisineIdsForMenuItem,
  getCuisinesForMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
