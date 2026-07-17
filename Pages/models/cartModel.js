const { sql, getPool } = require('../config/database');

function parseCart(json) {
  try { const cart = JSON.parse(json || '[]'); return Array.isArray(cart) ? cart : []; }
  catch { return []; }
}

async function getCart(userId) {
  const result = await (await getPool()).request().input('userId', sql.Int, userId)
    .query('SELECT CartItemsJson FROM dbo.Carts WHERE UserId=@userId');
  return result.recordset[0] ? parseCart(result.recordset[0].CartItemsJson) : [];
}

async function saveCart(userId, cart) {
  const cartJson = JSON.stringify(cart);
  await (await getPool()).request().input('userId', sql.Int, userId).input('cartJson', sql.NVarChar(sql.MAX), cartJson)
    .query(`MERGE dbo.Carts AS target USING (SELECT @userId AS UserId, @cartJson AS CartItemsJson) AS source
      ON target.UserId=source.UserId WHEN MATCHED THEN UPDATE SET CartItemsJson=source.CartItemsJson, UpdatedAt=SYSDATETIME()
      WHEN NOT MATCHED THEN INSERT (UserId,CartItemsJson) VALUES (source.UserId,source.CartItemsJson);`);
}

module.exports = { getCart, saveCart };
