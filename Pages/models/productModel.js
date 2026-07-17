const { sql, getPool } = require('../config/database');
async function getAvailableProducts() { return (await (await getPool()).request().query('SELECT ProductId,ProductName,Description,StallName,Price,Emoji,Colour FROM dbo.Products WHERE IsAvailable=1 ORDER BY ProductId')).recordset; }
async function getAvailableProduct(id) { return (await (await getPool()).request().input('id', sql.Int, id).query('SELECT ProductId,ProductName,StallName,Price,Emoji,Colour FROM dbo.Products WHERE ProductId=@id AND IsAvailable=1')).recordset[0]; }
module.exports = { getAvailableProducts, getAvailableProduct };
