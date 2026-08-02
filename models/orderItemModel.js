// models/orderItemModel.js — CRUD for the OrderItem table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllOrderItems(orderId) {
  await poolConnect;
  const request = pool.request();
  let query = `
    SELECT oi.OrderItemId, oi.OrderId, oi.MenuItemId, oi.Quantity, oi.UnitPrice,
           oi.AddOns, oi.AddOnCharge,
           m.Name AS MenuItemName, m.Category AS MenuItemCategory, m.StallId,
           s.OwnerId,
           (oi.Quantity * oi.UnitPrice + ISNULL(oi.AddOnCharge, 0)) AS LineTotal
    FROM OrderItem oi
    JOIN MenuItem m ON oi.MenuItemId = m.MenuItemId
    JOIN Stall s ON m.StallId = s.StallId
  `;
  if (orderId) {
    request.input('OrderId', sql.Int, orderId);
    query += ' WHERE oi.OrderId = @OrderId';
  }
  query += ' ORDER BY oi.OrderItemId';
  const result = await request.query(query);
  return result.recordset;
}

async function getOrderItemById(orderItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderItemId', sql.Int, orderItemId);
  const result = await request.query(`
    SELECT oi.OrderItemId, oi.OrderId, oi.MenuItemId, oi.Quantity, oi.UnitPrice,
           oi.AddOns, oi.AddOnCharge,
           m.Name AS MenuItemName, m.Category AS MenuItemCategory, m.StallId,
           s.OwnerId,
           (oi.Quantity * oi.UnitPrice + ISNULL(oi.AddOnCharge, 0)) AS LineTotal
    FROM OrderItem oi
    JOIN MenuItem m ON oi.MenuItemId = m.MenuItemId
    JOIN Stall s ON m.StallId = s.StallId
    WHERE oi.OrderItemId = @OrderItemId
  `);
  return result.recordset[0] || null;
}

async function createOrderItem(data) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, data.orderId);
  request.input('MenuItemId', sql.Int, data.menuItemId);
  request.input('Quantity', sql.Int, data.quantity);
  request.input('UnitPrice', sql.Decimal(10, 2), data.unitPrice);
  request.input('AddOns', sql.NVarChar(500), data.addOns || null);
  request.input('AddOnCharge', sql.Decimal(10, 2), data.addOnCharge || 0);
  const result = await request.query(`
    INSERT INTO OrderItem (OrderId, MenuItemId, Quantity, UnitPrice, AddOns, AddOnCharge)
    OUTPUT INSERTED.*
    VALUES (@OrderId, @MenuItemId, @Quantity, @UnitPrice, @AddOns, @AddOnCharge)
  `);
  return result.recordset[0];
}

async function updateOrderItem(orderItemId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderItemId', sql.Int, orderItemId);
  request.input('Quantity', sql.Int, data.quantity);
  request.input('AddOns', sql.NVarChar(500), data.addOns || null);
  request.input('AddOnCharge', sql.Decimal(10, 2), data.addOnCharge || 0);
  const result = await request.query(`
    UPDATE OrderItem
    SET Quantity = @Quantity, AddOns = @AddOns, AddOnCharge = @AddOnCharge
    OUTPUT INSERTED.*
    WHERE OrderItemId = @OrderItemId
  `);
  return result.recordset[0] || null;
}

async function deleteOrderItem(orderItemId) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderItemId', sql.Int, orderItemId);
  const result = await request.query('DELETE FROM OrderItem WHERE OrderItemId = @OrderItemId');
  return result.rowsAffected[0] > 0;
}

module.exports = {
  getAllOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
};
