const { sql, getPool } = require('../config/database');
async function createOrder(userId, cart, address, ecoPackaging) {
  const transaction = new sql.Transaction(await getPool()); let begun = false;
  try {
    await transaction.begin(); begun = true;
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const total = subtotal + 1.50 + 0.50 + (ecoPackaging ? 0.30 : 0);
    const order = await new sql.Request(transaction).input('userId', sql.Int, userId).input('total', sql.Decimal(10, 2), total).input('address', sql.NVarChar(250), address || null).query("INSERT INTO dbo.Orders (UserId,TotalAmount,DeliveryAddress,Status) OUTPUT INSERTED.OrderId VALUES (@userId,@total,@address,'Preparing')");
    for (const item of cart) await new sql.Request(transaction).input('orderId', sql.Int, order.recordset[0].OrderId).input('productId', sql.Int, item.productId).input('quantity', sql.Int, item.quantity).input('price', sql.Decimal(10, 2), item.price).query('INSERT INTO dbo.OrderItems (OrderId,ProductId,Quantity,UnitPrice) VALUES (@orderId,@productId,@quantity,@price)');
    await transaction.commit(); return { orderId: order.recordset[0].OrderId, total };
  } catch (error) { if (begun) await transaction.rollback().catch(() => {}); throw error; }
}
async function getOrdersByUser(userId) { const result = await (await getPool()).request().input('userId', sql.Int, userId).query(`SELECT o.OrderId,o.OrderDate,o.TotalAmount,o.Status,STRING_AGG(p.ProductName, ', ') AS Items FROM dbo.Orders o JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE o.UserId=@userId GROUP BY o.OrderId,o.OrderDate,o.TotalAmount,o.Status ORDER BY o.OrderDate DESC`); return result.recordset; }
module.exports = { createOrder, getOrdersByUser };
