// models/orderModel.js — CRUD for the [Order] table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllOrders() {
  await poolConnect;
  const result = await pool.request().query(`
    SELECT o.OrderId, o.StallId, o.CustomerId, o.GuestName, o.OrderDate, o.Status,
           o.TotalAmount, o.PaymentStatus, o.SpecialInstructions,
           s.Name AS StallName, s.OwnerId,
           u.FullName AS CustomerName, u.Email AS CustomerEmail,
           (
             SELECT ISNULL(SUM(Quantity), 0) FROM OrderItem oi WHERE oi.OrderId = o.OrderId
           ) AS ItemCount
    FROM [Order] o
    JOIN Stall s ON o.StallId = s.StallId
    LEFT JOIN [User] u ON o.CustomerId = u.UserId
    ORDER BY o.OrderDate DESC, o.OrderId DESC
  `);
  return result.recordset;
}

async function getOrdersByCustomerId(customerId) {
  await poolConnect;
  const request = pool.request();
  request.input('CustomerId', sql.Int, customerId);
  const result = await request.query(`
    SELECT o.OrderId, o.StallId, o.CustomerId, o.GuestName, o.OrderDate, o.Status,
           o.TotalAmount, o.PaymentStatus, o.SpecialInstructions,
           s.Name AS StallName, s.OwnerId,
           (
             SELECT ISNULL(SUM(Quantity), 0) FROM OrderItem oi WHERE oi.OrderId = o.OrderId
           ) AS ItemCount
    FROM [Order] o
    JOIN Stall s ON o.StallId = s.StallId
    WHERE o.CustomerId = @CustomerId
    ORDER BY o.OrderDate DESC, o.OrderId DESC
  `);
  return result.recordset;
}

async function getOrdersByVendorStalls(vendorId) {
  await poolConnect;
  const request = pool.request();
  request.input('VendorId', sql.Int, vendorId);
  const result = await request.query(`
    SELECT o.OrderId, o.StallId, o.CustomerId, o.GuestName, o.OrderDate, o.Status,
           o.TotalAmount, o.PaymentStatus, o.SpecialInstructions,
           s.Name AS StallName, s.OwnerId,
           u.FullName AS CustomerName, u.Email AS CustomerEmail,
           (
             SELECT ISNULL(SUM(Quantity), 0) FROM OrderItem oi WHERE oi.OrderId = o.OrderId
           ) AS ItemCount
    FROM [Order] o
    JOIN Stall s ON o.StallId = s.StallId
    LEFT JOIN [User] u ON o.CustomerId = u.UserId
    WHERE s.OwnerId = @VendorId
    ORDER BY o.OrderDate DESC, o.OrderId DESC
  `);
  return result.recordset;
}

async function getOrdersByStallId(stallId) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, stallId);
  const result = await request.query(`
    SELECT o.OrderId, o.StallId, o.CustomerId, o.GuestName, o.OrderDate, o.Status,
           o.TotalAmount, o.PaymentStatus, o.SpecialInstructions,
           s.Name AS StallName, s.OwnerId,
           u.FullName AS CustomerName, u.Email AS CustomerEmail,
           (
             SELECT ISNULL(SUM(Quantity), 0) FROM OrderItem oi WHERE oi.OrderId = o.OrderId
           ) AS ItemCount
    FROM [Order] o
    JOIN Stall s ON o.StallId = s.StallId
    LEFT JOIN [User] u ON o.CustomerId = u.UserId
    WHERE o.StallId = @StallId
    ORDER BY o.OrderDate DESC, o.OrderId DESC
  `);
  return result.recordset;
}

async function getOrderById(orderId) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, orderId);
  const orderResult = await request.query(`
    SELECT o.OrderId, o.StallId, o.CustomerId, o.GuestName, o.OrderDate, o.Status,
           o.TotalAmount, o.PaymentStatus, o.SpecialInstructions,
           s.Name AS StallName, s.OwnerId, s.HawkerCentreId,
           u.FullName AS CustomerName, u.Email AS CustomerEmail
    FROM [Order] o
    JOIN Stall s ON o.StallId = s.StallId
    LEFT JOIN [User] u ON o.CustomerId = u.UserId
    WHERE o.OrderId = @OrderId
  `);
  const order = orderResult.recordset[0];
  if (!order) return null;

  const itemsResult = await request.query(`
    SELECT oi.OrderItemId, oi.OrderId, oi.MenuItemId, oi.Quantity, oi.UnitPrice,
           oi.AddOns, oi.AddOnCharge,
           m.Name AS MenuItemName, m.Category AS MenuItemCategory,
           (oi.Quantity * oi.UnitPrice + ISNULL(oi.AddOnCharge, 0)) AS LineTotal
    FROM OrderItem oi
    JOIN MenuItem m ON oi.MenuItemId = m.MenuItemId
    WHERE oi.OrderId = @OrderId
    ORDER BY oi.OrderItemId
  `);
  order.Items = itemsResult.recordset;
  return order;
}

async function createOrder(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('CustomerId', sql.Int, data.customerId || null);
  request.input('GuestName', sql.NVarChar(100), data.guestName || null);
  request.input('TotalAmount', sql.Decimal(10, 2), data.totalAmount);
  request.input('PaymentStatus', sql.NVarChar(20), data.paymentStatus || 'Paid');
  request.input('SpecialInstructions', sql.NVarChar(500), data.specialInstructions || null);
  request.input('Status', sql.NVarChar(20), data.status || 'Pending');
  const result = await request.query(`
    INSERT INTO [Order] (StallId, CustomerId, GuestName, TotalAmount, PaymentStatus, SpecialInstructions, Status)
    OUTPUT INSERTED.*
    VALUES (@StallId, @CustomerId, @GuestName, @TotalAmount, @PaymentStatus, @SpecialInstructions, @Status)
  `);
  return result.recordset[0];
}

async function updateOrderStatus(orderId, status) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, orderId);
  request.input('Status', sql.NVarChar(20), status);
  const result = await request.query(`
    UPDATE [Order] SET Status = @Status
    OUTPUT INSERTED.*
    WHERE OrderId = @OrderId
  `);
  return result.recordset[0] || null;
}

async function updateOrderInstructions(orderId, specialInstructions) {
  await poolConnect;
  const request = pool.request();
  request.input('OrderId', sql.Int, orderId);
  request.input('SpecialInstructions', sql.NVarChar(500), specialInstructions || null);
  const result = await request.query(`
    UPDATE [Order] SET SpecialInstructions = @SpecialInstructions
    OUTPUT INSERTED.*
    WHERE OrderId = @OrderId
  `);
  return result.recordset[0] || null;
}

async function deleteOrder(orderId) {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const req = new sql.Request(transaction);
    req.input('OrderId', sql.Int, orderId);
    await req.query('DELETE FROM OrderItem WHERE OrderId = @OrderId');
    await req.query('DELETE FROM OrderStatusLog WHERE OrderId = @OrderId');
    const delRes = await req.query('DELETE FROM [Order] WHERE OrderId = @OrderId');
    await transaction.commit();
    return delRes.rowsAffected[0] > 0;
  } catch (err) {
    try { await transaction.rollback(); } catch (_) { /* ignore */ }
    throw err;
  }
}

module.exports = {
  getAllOrders,
  getOrdersByCustomerId,
  getOrdersByVendorStalls,
  getOrdersByStallId,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderInstructions,
  deleteOrder,
};
