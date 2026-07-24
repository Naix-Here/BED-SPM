// models/vendorMenuModel.js — Full CRUD for menu items + likes + cuisines
const { sql, getPool } = require('../config/database');

const VendorMenu = {
  async findAll(filters = {}) {
    const { stallId, category, search, cuisine, page = 1, limit = 20 } = filters;
    let where = 'WHERE 1=1'; const req = (await getPool()).request();
    if (stallId) { where += ' AND mi.StallId=@stallId'; req.input('stallId', sql.Int, stallId); }
    if (category) { where += ' AND mi.Category=@category'; req.input('category', sql.VarChar(20), category); }
    if (search) { where += ' AND (mi.Name LIKE @search OR mi.Description LIKE @search)'; req.input('search', sql.NVarChar(200), `%${search}%`); }
    if (cuisine) { where += ' AND EXISTS(SELECT 1 FROM dbo.MenuItemCuisines mic JOIN dbo.Cuisines c ON c.CuisineId=mic.CuisineId WHERE mic.ItemId=mi.ItemId AND c.Name=@cuisine)'; req.input('cuisine', sql.NVarChar(100), cuisine); }
    const offset = (page - 1) * limit;
    const countRequest = (await getPool()).request();
    if (stallId) countRequest.input('stallId', sql.Int, stallId);
    if (category) countRequest.input('category', sql.VarChar(20), category);
    if (search) countRequest.input('search', sql.NVarChar(200), `%${search}%`);
    if (cuisine) countRequest.input('cuisine', sql.NVarChar(100), cuisine);
    const [[{ total }]] = (await countRequest.query(`SELECT COUNT(*) AS total FROM dbo.MenuItems mi ${where}`)).recordsets;
    const items = (await req.input('limit', sql.Int, limit).input('offset', sql.Int, offset).query(`SELECT mi.*,s.StallName,s.StallNumber,(SELECT COUNT(*) FROM dbo.MenuLikes WHERE ItemId=mi.ItemId) AS LikeCount FROM dbo.MenuItems mi JOIN dbo.Stalls s ON s.StallId=mi.StallId ${where} ORDER BY mi.Category,mi.Name OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`)).recordset;
    for (const item of items) {
      item.Cuisines = (await (await getPool()).request().input('itemId', sql.Int, item.ItemId).query(`SELECT c.CuisineId,c.Name FROM dbo.MenuItemCuisines mic JOIN dbo.Cuisines c ON c.CuisineId=mic.CuisineId WHERE mic.ItemId=@itemId`)).recordset;
    }
    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  },

  async findById(itemId) {
    const item = (await (await getPool()).request().input('itemId', sql.Int, itemId).query(`SELECT mi.*,s.StallName,s.StallNumber,s.OwnerId,(SELECT COUNT(*) FROM dbo.MenuLikes WHERE ItemId=mi.ItemId) AS LikeCount FROM dbo.MenuItems mi JOIN dbo.Stalls s ON s.StallId=mi.StallId WHERE mi.ItemId=@itemId`)).recordset[0] || null;
    if (!item) return null;
    item.Cuisines = (await (await getPool()).request().input('itemId', sql.Int, itemId).query(`SELECT c.CuisineId,c.Name FROM dbo.MenuItemCuisines mic JOIN dbo.Cuisines c ON c.CuisineId=mic.CuisineId WHERE mic.ItemId=@itemId`)).recordset;
    return item;
  },

  async create(data, cuisineIds = []) {
    const { stallId, name, description, price, category, imageUrl, isAvailable, isPromotion, promotionPrice, promotionStart, promotionEnd } = data;
    const req = (await getPool()).request();
    req.input('stallId', sql.Int, stallId).input('name', sql.NVarChar(200), name).input('price', sql.Decimal(8,2), price);
    req.input('description', sql.NVarChar(500), description || null).input('category', sql.VarChar(20), category || 'main_dish');
    req.input('imageUrl', sql.VarChar(500), imageUrl || null).input('isAvailable', sql.Bit, isAvailable !== undefined ? isAvailable : 1);
    req.input('isPromotion', sql.Bit, isPromotion || 0).input('promotionPrice', sql.Decimal(8,2), promotionPrice || null);
    req.input('promotionStart', sql.Date, promotionStart || null).input('promotionEnd', sql.Date, promotionEnd || null);
    const result = await req.query(`INSERT INTO dbo.MenuItems (StallId,Name,Description,Price,Category,ImageUrl,IsAvailable,IsPromotion,PromotionPrice,PromotionStart,PromotionEnd) OUTPUT INSERTED.ItemId VALUES (@stallId,@name,@description,@price,@category,@imageUrl,@isAvailable,@isPromotion,@promotionPrice,@promotionStart,@promotionEnd)`);
    const itemId = result.recordset[0].ItemId;
    if (cuisineIds.length) {
      const values = cuisineIds.map((c, i) => `(@itemId${i},@cuisine${i})`).join(',');
      const ins = (await getPool()).request().input('itemId', sql.Int, itemId);
      cuisineIds.forEach((c, i) => ins.input(`cuisine${i}`, sql.Int, c));
      await ins.query(`INSERT INTO dbo.MenuItemCuisines (ItemId,CuisineId) VALUES ${values}`);
    }
    return { itemId, ...data };
  },

  async update(itemId, data, cuisineIds = null) {
    const fields = [], req = (await getPool()).request();
    ['Name','Description','Price','Category','ImageUrl','IsAvailable','IsPromotion','PromotionPrice','PromotionStart','PromotionEnd'].forEach(f => {
      if (data[f] !== undefined) { fields.push(`${f}=@${f}`); req.input(f, f==='Name'||f==='Description'?sql.NVarChar(200):f==='Price'||f==='PromotionPrice'?sql.Decimal(8,2):f==='IsAvailable'||f==='IsPromotion'?sql.Bit:sql.VarChar(20), data[f]); }
    });
    if (fields.length) { req.input('itemId', sql.Int, itemId); await req.query(`UPDATE dbo.MenuItems SET ${fields.join(',')},UpdatedAt=SYSDATETIME() WHERE ItemId=@itemId`); }
    if (cuisineIds !== null) {
      await (await getPool()).request().input('itemId', sql.Int, itemId).query(`DELETE FROM dbo.MenuItemCuisines WHERE ItemId=@itemId`);
      if (cuisineIds.length) {
        const vals = cuisineIds.map((c, i) => `(@itemId${i},@cuisine${i})`).join(',');
        const ins = (await getPool()).request();
        cuisineIds.forEach((c, i) => ins.input(`cuisine${i}`, sql.Int, c).input(`itemId${i}`, sql.Int, itemId));
        await ins.query(`INSERT INTO dbo.MenuItemCuisines (ItemId,CuisineId) VALUES ${vals}`);
      }
    }
    return this.findById(itemId);
  },

  async delete(itemId) {
    const [[{ cnt }]] = (await (await getPool()).request().input('itemId', sql.Int, itemId).query(`SELECT COUNT(*) AS cnt FROM dbo.OrderItems oi JOIN dbo.Orders o ON o.OrderId=oi.OrderId`)).recordsets;
    if (cnt > 0) {
      await (await getPool()).request().input('itemId', sql.Int, itemId).query(`UPDATE dbo.MenuItems SET IsAvailable=0,UpdatedAt=SYSDATETIME() WHERE ItemId=@itemId`);
      return { itemId, deleted: false, softDeleted: true, message: 'Item has existing orders. Marked as unavailable.' };
    }
    await (await getPool()).request().input('itemId', sql.Int, itemId).query(`DELETE FROM dbo.MenuItems WHERE ItemId=@itemId`);
    return { itemId, deleted: true };
  },

  async toggleLike(itemId, userId) {
    const existing = (await (await getPool()).request().input('itemId', sql.Int, itemId).input('userId', sql.Int, userId).query(`SELECT * FROM dbo.MenuLikes WHERE ItemId=@itemId AND UserId=@userId`)).recordset[0];
    if (existing) { await (await getPool()).request().input('itemId', sql.Int, itemId).input('userId', sql.Int, userId).query(`DELETE FROM dbo.MenuLikes WHERE ItemId=@itemId AND UserId=@userId`); return { liked: false, message: 'Like removed.' }; }
    await (await getPool()).request().input('itemId', sql.Int, itemId).input('userId', sql.Int, userId).query(`INSERT INTO dbo.MenuLikes (ItemId,UserId) VALUES (@itemId,@userId)`);
    return { liked: true, message: 'Item liked.' };
  },

  async getPopular(limit = 10, stallId = null) {
    let q = `SELECT TOP (@limit) mi.*,COUNT(DISTINCT ml.LikeId) AS LikeCount FROM dbo.MenuItems mi LEFT JOIN dbo.MenuLikes ml ON ml.ItemId=mi.ItemId WHERE mi.IsAvailable=1`; const req = (await getPool()).request();
    if (stallId) { q += ' AND mi.StallId=@stallId'; req.input('stallId', sql.Int, stallId); }
    q += ' GROUP BY mi.ItemId,mi.StallId,mi.Name,mi.Description,mi.Price,mi.Category,mi.ImageUrl,mi.IsAvailable,mi.IsPromotion,mi.PromotionPrice,mi.PromotionStart,mi.PromotionEnd,mi.CreatedAt,mi.UpdatedAt ORDER BY LikeCount DESC';
    req.input('limit', sql.Int, limit);
    return (await req.query(q)).recordset;
  }
};

module.exports = VendorMenu;
