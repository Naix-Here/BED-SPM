// models/cartItemModel.js — CRUD for the CartItem table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllCartItems(cartId) {
  await poolConnect;
  const request = pool.request();
  if (cartId) {
    request.input('CartId', sql.Int, cartId);
    const result = await request.query(`
      SELECT ci.CartItemId, ci.CartId, ci.MenuItemId, ci.Quantity, ci.AddOns, ci.AddOnCharge,
             m.Name AS MenuItemName, m.Price, m.Category, m.IsAvailable, m.StallId,
             (ci.Quantity * m.Price + ISNULL(ci.AddOnCharge, 0)) AS LineTotal
      FROM CartItem ci
      JOIN MenuItem m ON ci.MenuItemId = m.MenuItemId
      WHERE ci.CartId = @CartId
      ORDER BY ci.CartItemId
    `);
    return result.recordset;
  }
  const result = await request.query(`
    SELECT ci.CartItemId, ci.CartId, ci.MenuItemId, ci.Quantity, ci.AddOns, ci.AddOnCharge,
           m.Name AS MenuItemName, m.Price, m.Category, m.IsAvailable, m.StallId,
           (ci.Quantity * m.Price + ISNULL(ci.AddOnCharge, 0)) AS LineTotal
    FROM CartItem ci
    JOIN MenuItem m ON ci.MenuItemId = m.MenuItemId
    ORDER BY ci.CartItemId
  `);
  return result.recordset;
}

async function getCartItemById(cartItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('CartItemId', sql.Int, cartItemId);
  const result = await request.query(`
    SELECT ci.CartItemId, ci.CartId, ci.MenuItemId, ci.Quantity, ci.AddOns, ci.AddOnCharge,
           m.Name AS MenuItemName, m.Price, m.Category, m.IsAvailable, m.StallId,
           (ci.Quantity * m.Price + ISNULL(ci.AddOnCharge, 0)) AS LineTotal
    FROM CartItem ci
    JOIN MenuItem m ON ci.MenuItemId = m.MenuItemId
    WHERE ci.CartItemId = @CartItemId
  `);
  return result.recordset[0] || null;
}

async function createCartItem(data) {
  await poolConnect;
  const request = pool.request();
  request.input('CartId', sql.Int, data.cartId);
  request.input('MenuItemId', sql.Int, data.menuItemId);
  request.input('Quantity', sql.Int, data.quantity);
  request.input('AddOns', sql.NVarChar(500), data.addOns || null);
  request.input('AddOnCharge', sql.Decimal(10, 2), data.addOnCharge || 0);
  const result = await request.query(`
    INSERT INTO CartItem (CartId, MenuItemId, Quantity, AddOns, AddOnCharge)
    OUTPUT INSERTED.*
    VALUES (@CartId, @MenuItemId, @Quantity, @AddOns, @AddOnCharge)
  `);
  return result.recordset[0];
}

async function updateCartItem(cartItemId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('CartItemId', sql.Int, cartItemId);
  request.input('Quantity', sql.Int, data.quantity);
  request.input('AddOns', sql.NVarChar(500), data.addOns || null);
  request.input('AddOnCharge', sql.Decimal(10, 2), data.addOnCharge || 0);
  const result = await request.query(`
    UPDATE CartItem
    SET Quantity = @Quantity, AddOns = @AddOns, AddOnCharge = @AddOnCharge
    OUTPUT INSERTED.*
    WHERE CartItemId = @CartItemId
  `);
  return result.recordset[0] || null;
}

async function deleteCartItem(cartItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('CartItemId', sql.Int, cartItemId);
  const result = await request.query('DELETE FROM CartItem WHERE CartItemId = @CartItemId');
  return result.rowsAffected[0] > 0;
}

async function deleteAllItemsForCart(cartId) {
  await poolConnect;
  const request = pool.request();
  request.input('CartId', sql.Int, cartId);
  const result = await request.query('DELETE FROM CartItem WHERE CartId = @CartId');
  return result.rowsAffected[0];
}

module.exports = {
  getAllCartItems,
  getCartItemById,
  createCartItem,
  updateCartItem,
  deleteCartItem,
  deleteAllItemsForCart,
};
