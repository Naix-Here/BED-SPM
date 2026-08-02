// models/cartModel.js — CRUD for the Cart table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getCartById(cartId) {
  await poolConnect;
  const request = pool.request();
  request.input('CartId', sql.Int, cartId);
  const cartRes = await request.query(`
    SELECT c.CartId, c.CustomerId, c.SessionId, c.StallId, c.CreatedAt,
           s.Name AS StallName, s.OwnerId
    FROM Cart c
    JOIN Stall s ON c.StallId = s.StallId
    WHERE c.CartId = @CartId
  `);
  const cart = cartRes.recordset[0];
  if (!cart) return null;

  const itemsRes = await request.query(`
    SELECT ci.CartItemId, ci.CartId, ci.MenuItemId, ci.Quantity, ci.AddOns, ci.AddOnCharge,
           m.Name AS MenuItemName, m.Price, m.Category, m.IsAvailable,
           (ci.Quantity * m.Price + ISNULL(ci.AddOnCharge, 0)) AS LineTotal
    FROM CartItem ci
    JOIN MenuItem m ON ci.MenuItemId = m.MenuItemId
    WHERE ci.CartId = @CartId
    ORDER BY ci.CartItemId
  `);
  cart.Items = itemsRes.recordset;
  return cart;
}

async function getCartsForUserOrSession(customerId, sessionId) {
  await poolConnect;
  const request = pool.request();
  const conditions = [];
  if (customerId) {
    request.input('CustomerId', sql.Int, customerId);
    conditions.push('c.CustomerId = @CustomerId');
  }
  if (sessionId) {
    request.input('SessionId', sql.NVarChar(100), sessionId);
    conditions.push('c.SessionId = @SessionId');
  }
  if (!conditions.length) return [];

  let query = `
    SELECT c.CartId, c.CustomerId, c.SessionId, c.StallId, c.CreatedAt,
           s.Name AS StallName
    FROM Cart c
    JOIN Stall s ON c.StallId = s.StallId
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.CreatedAt DESC
  `;
  const result = await request.query(query);
  return result.recordset;
}

async function getAllCarts() {
  await poolConnect;
  const result = await pool.request().query(`
    SELECT c.CartId, c.CustomerId, c.SessionId, c.StallId, c.CreatedAt,
           s.Name AS StallName
    FROM Cart c
    JOIN Stall s ON c.StallId = s.StallId
    ORDER BY c.CreatedAt DESC
  `);
  return result.recordset;
}

async function findExistingCart(customerId, sessionId, stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const conditions = ['c.StallId = @StallId'];
  if (customerId) {
    request.input('CustomerId', sql.Int, customerId);
    conditions.push('c.CustomerId = @CustomerId');
  }
  if (sessionId) {
    request.input('SessionId', sql.NVarChar(100), sessionId);
    conditions.push('c.SessionId = @SessionId');
  }
  const result = await request.query(`
    SELECT TOP 1 c.CartId FROM Cart c
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.CreatedAt DESC
  `);
  return result.recordset[0] ? result.recordset[0].CartId : null;
}

async function createCart(data) {
  await poolConnect;
  const request = pool.request();
  request.input('CustomerId', sql.Int, data.customerId || null);
  request.input('SessionId', sql.NVarChar(100), data.sessionId || null);
  request.input('StallId', sql.Int, data.stallId);
  const result = await request.query(`
    INSERT INTO Cart (CustomerId, SessionId, StallId)
    OUTPUT INSERTED.*
    VALUES (@CustomerId, @SessionId, @StallId)
  `);
  return result.recordset[0];
}

async function deleteCart(cartId) {
  await poolConnect;
  const request = pool.request();
  request.input('CartId', sql.Int, cartId);
  const result = await request.query('DELETE FROM Cart WHERE CartId = @CartId');
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
  getCartById,
  getCartsForUserOrSession,
  getAllCarts,
  findExistingCart,
  createCart,
  deleteCart,
  stallExists,
};
