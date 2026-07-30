const { sql, getPool } = require('../config/database');
async function createOrder(userId, cart, address, ecoPackaging, reward) {
  const transaction = new sql.Transaction(await getPool()); let begun = false;
  try {
    await transaction.begin(); begun = true;
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const preDiscountTotal = subtotal + 1.50 + 0.50 + (ecoPackaging ? 0.30 : 0);
    const appliedReward = await getClaimedReward(transaction, userId, reward, preDiscountTotal);
    const total = preDiscountTotal - (appliedReward ? appliedReward.discount : 0);
    const order = await new sql.Request(transaction).input('userId', sql.Int, userId).input('total', sql.Decimal(10, 2), total).input('address', sql.NVarChar(250), address || null).query("INSERT INTO dbo.Orders (UserId,TotalAmount,DeliveryAddress,Status) OUTPUT INSERTED.OrderId VALUES (@userId,@total,@address,'Preparing')");
    for (const item of cart) await new sql.Request(transaction).input('orderId', sql.Int, order.recordset[0].OrderId).input('menuItemId', sql.Int, item.menuItemId || item.productId).input('quantity', sql.Int, item.quantity).input('price', sql.Decimal(10, 2), item.price).query('INSERT INTO dbo.OrderItems (OrderId,MenuItemId,Quantity,UnitPrice) VALUES (@orderId,@menuItemId,@quantity,@price)');
    if (appliedReward) await new sql.Request(transaction).input('id', sql.Int, appliedReward.redemptionId).input('orderId', sql.Int, order.recordset[0].OrderId).input('discount', sql.Decimal(10, 2), appliedReward.discount).query(`UPDATE dbo.${appliedReward.table} SET OrderId=@orderId,DiscountApplied=@discount WHERE ${appliedReward.key}=@id AND OrderId IS NULL`);
    await transaction.commit(); return { orderId: order.recordset[0].OrderId, total, discount: appliedReward ? appliedReward.discount : 0 };
  } catch (error) { if (begun) await transaction.rollback().catch(() => {}); throw error; }
}
async function getClaimedReward(transaction, userId, reward, total) {
  if (!reward || !['voucher', 'promotion'].includes(reward.type) || !Number.isInteger(Number(reward.id))) return null;
  const isVoucher = reward.type === 'voucher', table = isVoucher ? 'VoucherRedemptions' : 'PromotionCodeRedemptions', key = isVoucher ? 'VoucherRedemptionId' : 'PromotionCodeRedemptionId', foreignKey = isVoucher ? 'VoucherId' : 'PromotionCodeId', source = isVoucher ? 'Vouchers' : 'PromotionCodes';
  const result = await new sql.Request(transaction).input('userId', sql.Int, userId).input('id', sql.Int, Number(reward.id)).query(`SELECT r.${key} AS RedemptionId,s.DiscountType,s.DiscountValue,s.MinimumSpend FROM dbo.${table} r JOIN dbo.${source} s ON s.${foreignKey}=r.${foreignKey} WHERE r.UserId=@userId AND r.${foreignKey}=@id AND r.OrderId IS NULL AND s.IsActive=1 AND CAST(SYSDATETIME() AS DATE) BETWEEN s.ValidFrom AND s.ValidUntil`);
  const row = result.recordset[0]; if (!row) return null;
  if (total < Number(row.MinimumSpend)) throw new Error(`This reward requires a minimum spend of $${Number(row.MinimumSpend).toFixed(2)}.`);
  return { table, key, redemptionId: row.RedemptionId, discount: Math.min(total, row.DiscountType === 'percentage' ? total * Number(row.DiscountValue) / 100 : Number(row.DiscountValue)) };
}
async function getOrdersByUser(userId) { const result = await (await getPool()).request().input('userId', sql.Int, userId).query(`SELECT o.OrderId,o.OrderDate,o.TotalAmount,o.Status,STRING_AGG(COALESCE(mi.Name,p.ProductName), ', ') AS Items FROM dbo.Orders o JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId LEFT JOIN dbo.MenuItems mi ON mi.ItemId=oi.MenuItemId LEFT JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE o.UserId=@userId GROUP BY o.OrderId,o.OrderDate,o.TotalAmount,o.Status ORDER BY o.OrderDate DESC`); return result.recordset; }
module.exports = { createOrder, getOrdersByUser };
