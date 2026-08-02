// models/promotionModel.js — CRUD for the Promotion table.
const { sql, pool, poolConnect } = require('../config/dbConfig');

async function getAllPromotions(stallId, activeOnly) {
  await poolConnect;
  const request = pool.request();
  const conditions = [];
  if (stallId) {
    request.input('StallId', sql.Int, stallId);
    conditions.push('p.StallId = @StallId');
  }
  if (activeOnly) {
    conditions.push("p.IsActive = 1");
    conditions.push("CAST(GETDATE() AS DATE) BETWEEN p.StartDate AND p.EndDate");
  }
  let query = `
    SELECT p.PromotionId, p.StallId, p.Title, p.Description, p.DiscountType,
           p.DiscountValue, p.StartDate, p.EndDate, p.IsActive, p.CreatedAt,
           s.Name AS StallName, s.OwnerId
    FROM Promotion p
    JOIN Stall s ON p.StallId = s.StallId
  `;
  if (conditions.length) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  query += ' ORDER BY p.StartDate DESC';
  const result = await request.query(query);
  return result.recordset;
}

async function getPromotionById(promotionId) {
  await poolConnect;
  const request = pool.request();
  request.input('PromotionId', sql.Int, promotionId);
  const result = await request.query(`
    SELECT p.PromotionId, p.StallId, p.Title, p.Description, p.DiscountType,
           p.DiscountValue, p.StartDate, p.EndDate, p.IsActive, p.CreatedAt,
           s.Name AS StallName, s.OwnerId
    FROM Promotion p
    JOIN Stall s ON p.StallId = s.StallId
    WHERE p.PromotionId = @PromotionId
  `);
  return result.recordset[0] || null;
}

async function createPromotion(data) {
  await poolConnect;
  const request = pool.request();
  request.input('StallId', sql.Int, data.stallId);
  request.input('Title', sql.NVarChar(200), data.title);
  request.input('Description', sql.NVarChar(1000), data.description || null);
  request.input('DiscountType', sql.NVarChar(20), data.discountType);
  request.input('DiscountValue', sql.Decimal(10, 2), data.discountValue);
  request.input('StartDate', sql.Date, data.startDate);
  request.input('EndDate', sql.Date, data.endDate);
  request.input('IsActive', sql.Bit, data.isActive === false ? 0 : 1);
  const result = await request.query(`
    INSERT INTO Promotion (StallId, Title, Description, DiscountType, DiscountValue,
                           StartDate, EndDate, IsActive)
    OUTPUT INSERTED.*
    VALUES (@StallId, @Title, @Description, @DiscountType, @DiscountValue,
            @StartDate, @EndDate, @IsActive)
  `);
  return result.recordset[0];
}

async function updatePromotion(promotionId, data) {
  await poolConnect;
  const request = pool.request();
  request.input('PromotionId', sql.Int, promotionId);
  request.input('Title', sql.NVarChar(200), data.title);
  request.input('Description', sql.NVarChar(1000), data.description || null);
  request.input('DiscountType', sql.NVarChar(20), data.discountType);
  request.input('DiscountValue', sql.Decimal(10, 2), data.discountValue);
  request.input('StartDate', sql.Date, data.startDate);
  request.input('EndDate', sql.Date, data.endDate);
  request.input('IsActive', sql.Bit, data.isActive === false ? 0 : 1);
  const result = await request.query(`
    UPDATE Promotion
    SET Title = @Title, Description = @Description, DiscountType = @DiscountType,
        DiscountValue = @DiscountValue, StartDate = @StartDate, EndDate = @EndDate,
        IsActive = @IsActive
    OUTPUT INSERTED.*
    WHERE PromotionId = @PromotionId
  `);
  return result.recordset[0] || null;
}

async function deletePromotion(promotionId) {
  await poolConnect;
  const request = pool.request();
  request.input('PromotionId', sql.Int, promotionId);
  const result = await request.query('DELETE FROM Promotion WHERE PromotionId = @PromotionId');
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
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  deletePromotion,
  stallExists,
};
