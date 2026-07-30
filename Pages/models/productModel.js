const { sql, getPool } = require('../config/database');
const menuSelect = `SELECT mi.ItemId,mi.Name,mi.Description,mi.Price,mi.Category,mi.ImageUrl,mi.IsPromotion,mi.PromotionPrice,
  s.StallName,s.StallNumber,COALESCE(NULLIF(STRING_AGG(c.Name, ', '), ''), COALESCE(s.CuisineType, 'Uncategorised')) AS Cuisines,
  CASE WHEN mi.IsPromotion=1 AND mi.PromotionPrice IS NOT NULL AND (mi.PromotionStart IS NULL OR mi.PromotionStart<=CAST(SYSDATETIME() AS DATE)) AND (mi.PromotionEnd IS NULL OR mi.PromotionEnd>=CAST(SYSDATETIME() AS DATE)) THEN mi.PromotionPrice ELSE mi.Price END AS EffectivePrice
  FROM dbo.MenuItems mi JOIN dbo.Stalls s ON s.StallId=mi.StallId LEFT JOIN dbo.MenuItemCuisines mic ON mic.ItemId=mi.ItemId LEFT JOIN dbo.Cuisines c ON c.CuisineId=mic.CuisineId`;
async function getAvailableProducts() { return (await (await getPool()).request().query(`${menuSelect} WHERE mi.IsAvailable=1 GROUP BY mi.ItemId,mi.Name,mi.Description,mi.Price,mi.Category,mi.ImageUrl,mi.IsPromotion,mi.PromotionPrice,mi.PromotionStart,mi.PromotionEnd,s.StallName,s.StallNumber,s.CuisineType ORDER BY s.StallName,mi.Name`)).recordset; }
async function getAvailableProduct(id) { return (await (await getPool()).request().input('id', sql.Int, id).query(`${menuSelect} WHERE mi.ItemId=@id AND mi.IsAvailable=1 GROUP BY mi.ItemId,mi.Name,mi.Description,mi.Price,mi.Category,mi.ImageUrl,mi.IsPromotion,mi.PromotionPrice,mi.PromotionStart,mi.PromotionEnd,s.StallName,s.StallNumber,s.CuisineType`)).recordset[0]; }
module.exports = { getAvailableProducts, getAvailableProduct };
