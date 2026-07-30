const { sql, getPool } = require('../config/database');
const active = "IsActive=1 AND CAST(SYSDATETIME() AS DATE) BETWEEN ValidFrom AND ValidUntil";
const normalise = row => ({ ...row, DiscountValue: Number(row.DiscountValue), MinimumSpend: Number(row.MinimumSpend) });

async function getRewards(userId) {
  const pool = await getPool();
  const [vouchers, promotions] = await Promise.all([
    pool.request().input('userId', sql.Int, userId).query(`WITH OrderCount AS (SELECT COUNT(*) AS CompletedOrders FROM dbo.Orders WHERE UserId=@userId AND Status<>'Cancelled') SELECT v.VoucherId,v.VoucherCode,v.VoucherName,v.RequiredOrderCount,v.DiscountType,v.DiscountValue,v.MinimumSpend,v.ValidUntil,oc.CompletedOrders,CASE WHEN vr.VoucherRedemptionId IS NULL THEN 0 ELSE 1 END AS IsClaimed,CASE WHEN vr.OrderId IS NULL THEN 0 ELSE 1 END AS IsUsed FROM dbo.Vouchers v CROSS JOIN OrderCount oc LEFT JOIN dbo.VoucherRedemptions vr ON vr.VoucherId=v.VoucherId AND vr.UserId=@userId WHERE v.IsActive=1 AND CAST(SYSDATETIME() AS DATE) BETWEEN v.ValidFrom AND v.ValidUntil ORDER BY v.RequiredOrderCount`),
    pool.request().input('userId', sql.Int, userId).query(`SELECT p.PromotionCodeId,p.Code,p.PromotionName,p.DiscountType,p.DiscountValue,p.MinimumSpend,p.ValidUntil,CASE WHEN pr.PromotionCodeRedemptionId IS NULL THEN 0 ELSE 1 END AS IsClaimed,CASE WHEN pr.OrderId IS NULL THEN 0 ELSE 1 END AS IsUsed FROM dbo.PromotionCodes p LEFT JOIN dbo.PromotionCodeRedemptions pr ON pr.PromotionCodeId=p.PromotionCodeId AND pr.UserId=@userId WHERE p.IsActive=1 AND CAST(SYSDATETIME() AS DATE) BETWEEN p.ValidFrom AND p.ValidUntil ORDER BY p.Code`)
  ]);
  return { vouchers: vouchers.recordset.map(normalise), promotions: promotions.recordset.map(normalise) };
}

async function redeemReward(userId, type, id) {
  const voucher = type === 'voucher';
  const source = voucher ? 'Vouchers' : 'PromotionCodes', sourceKey = voucher ? 'VoucherId' : 'PromotionCodeId', redemptions = voucher ? 'VoucherRedemptions' : 'PromotionCodeRedemptions', redemptionKey = voucher ? 'VoucherRedemptionId' : 'PromotionCodeRedemptionId';
  const pool = await getPool();
  const item = (await pool.request().input('id', sql.Int, id).query(`SELECT * FROM dbo.${source} WHERE ${sourceKey}=@id AND ${active}`)).recordset[0];
  if (!item) throw new Error('That reward is no longer available.');
  if (voucher) {
    const orders = (await pool.request().input('userId', sql.Int, userId).query("SELECT COUNT(*) AS Count FROM dbo.Orders WHERE UserId=@userId AND Status<>'Cancelled'")).recordset[0].Count;
    if (orders < item.RequiredOrderCount) throw new Error(`Complete ${item.RequiredOrderCount} orders to claim this voucher.`);
  }
  try {
    const result = await pool.request().input('userId', sql.Int, userId).input('id', sql.Int, id).query(`INSERT INTO dbo.${redemptions} (${sourceKey},UserId) OUTPUT INSERTED.${redemptionKey} AS redemptionId VALUES (@id,@userId)`);
    return { type, id, redemptionId: result.recordset[0].redemptionId, message: 'Reward claimed. Select it during checkout to apply it.' };
  } catch (error) {
    if (error.number === 2627 || error.number === 2601) throw new Error('You have already claimed this reward.');
    throw error;
  }
}
module.exports = { getRewards, redeemReward };
