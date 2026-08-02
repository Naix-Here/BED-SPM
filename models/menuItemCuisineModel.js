// models/menuItemCuisineModel.js — CRUD for the MenuItemCuisine mapping table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllMappings(menuItemId) {
  await poolConnect;
  const request = pool.request();
  let query = `
    SELECT mic.MenuItemCuisineId, mic.MenuItemId, mic.CuisineId,
           m.Name AS MenuItemName, c.Name AS CuisineName, m.StallId, s.OwnerId
    FROM MenuItemCuisine mic
    JOIN MenuItem m ON mic.MenuItemId = m.MenuItemId
    JOIN Cuisine c ON mic.CuisineId = c.CuisineId
    JOIN Stall s ON m.StallId = s.StallId
  `;
  if (menuItemId) {
    request.input('MenuItemId', sql.Int, menuItemId);
    query += ' WHERE mic.MenuItemId = @MenuItemId';
  }
  query += ' ORDER BY mic.MenuItemCuisineId';
  const result = await request.query(query);
  return result.recordset;
}

async function getMappingById(menuItemCuisineId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemCuisineId', sql.Int, menuItemCuisineId);
  const result = await request.query(`
    SELECT mic.MenuItemCuisineId, mic.MenuItemId, mic.CuisineId,
           m.Name AS MenuItemName, c.Name AS CuisineName, m.StallId, s.OwnerId
    FROM MenuItemCuisine mic
    JOIN MenuItem m ON mic.MenuItemId = m.MenuItemId
    JOIN Cuisine c ON mic.CuisineId = c.CuisineId
    JOIN Stall s ON m.StallId = s.StallId
    WHERE mic.MenuItemCuisineId = @MenuItemCuisineId
  `);
  return result.recordset[0] || null;
}

async function mappingExists(menuItemId, cuisineId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, menuItemId);
  request.input('CuisineId', sql.Int, cuisineId);
  const result = await request.query(`
    SELECT 1 AS Found FROM MenuItemCuisine
    WHERE MenuItemId = @MenuItemId AND CuisineId = @CuisineId
  `);
  return result.recordset.length > 0;
}

async function createMapping(data) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemId', sql.Int, data.menuItemId);
  request.input('CuisineId', sql.Int, data.cuisineId);
  const result = await request.query(`
    INSERT INTO MenuItemCuisine (MenuItemId, CuisineId)
    OUTPUT INSERTED.*
    VALUES (@MenuItemId, @CuisineId)
  `);
  return result.recordset[0];
}

async function updateMapping(menuItemCuisineId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemCuisineId', sql.Int, menuItemCuisineId);
  request.input('MenuItemId', sql.Int, data.menuItemId);
  request.input('CuisineId', sql.Int, data.cuisineId);
  const result = await request.query(`
    UPDATE MenuItemCuisine
    SET MenuItemId = @MenuItemId, CuisineId = @CuisineId
    OUTPUT INSERTED.*
    WHERE MenuItemCuisineId = @MenuItemCuisineId
  `);
  return result.recordset[0] || null;
}

async function deleteMapping(menuItemCuisineId) {
  await poolConnect;
  const request = pool.request();
  request.input('MenuItemCuisineId', sql.Int, menuItemCuisineId);
  const result = await request.query(
    'DELETE FROM MenuItemCuisine WHERE MenuItemCuisineId = @MenuItemCuisineId'
  );
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getAllMappings,
  getMappingById,
  mappingExists,
  createMapping,
  updateMapping,
  deleteMapping,
};
