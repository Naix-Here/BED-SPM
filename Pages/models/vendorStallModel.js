// models/vendorStallModel.js — Stall queries with performance metrics
const { sql, getPool } = require('../config/database');

const VendorStall = {
  async findByOwnerId(ownerId) {
    return (await (await getPool()).request().input('ownerId', sql.Int, ownerId).query(`SELECT s.*,hc.Name AS CentreName,(SELECT COUNT(*) FROM dbo.Orders o JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE p.StallName=s.StallName) AS TotalOrders,(SELECT COALESCE(AVG(CAST(f.Rating AS DECIMAL(3,1))),0) FROM dbo.Feedbacks f WHERE f.StallId=s.StallId) AS AvgRating FROM dbo.Stalls s JOIN dbo.HawkerCentres hc ON hc.CentreId=s.CentreId WHERE s.OwnerId=@ownerId ORDER BY s.StallName`)).recordset;
  },

  async findById(stallId) {
    return (await (await getPool()).request().input('stallId', sql.Int, stallId).query(`SELECT s.*,hc.Name AS CentreName,hc.Address AS CentreAddress,u.FullName AS OwnerName,u.Email AS OwnerEmail,(SELECT COUNT(*) FROM dbo.Orders o JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE p.StallName=s.StallName) AS TotalOrders,(SELECT COALESCE(AVG(CAST(f.Rating AS DECIMAL(3,1))),0) FROM dbo.Feedbacks f WHERE f.StallId=s.StallId) AS AvgRating FROM dbo.Stalls s JOIN dbo.HawkerCentres hc ON hc.CentreId=s.CentreId JOIN dbo.Users u ON u.UserId=s.OwnerId WHERE s.StallId=@stallId`)).recordset[0] || null;
  },

  async update(stallId, data) {
    const fields = [], params = [];
    ['StallName','CuisineType','Description','Status','OpeningHours','ImageUrl','StallNumber'].forEach(f => { if (data[f] !== undefined) { fields.push(`${f}=@${f}`); params.push({ name: f, type: f==='Description'||f==='CuisineType'?sql.NVarChar(150):f==='ImageUrl'?sql.VarChar(500):sql.NVarChar(100), value: data[f] }); }});
    if (!fields.length) throw new (require('../utils/AppError'))('No fields to update.', 400);
    const req = (await getPool()).request();
    params.forEach(p => req.input(p.name, p.type, p.value));
    req.input('stallId', sql.Int, stallId);
    await req.query(`UPDATE dbo.Stalls SET ${fields.join(',')} WHERE StallId=@stallId`);
    return this.findById(stallId);
  },

  async getDashboard(stallId, period = '30days') {
    const days = { '7days': 7, '30days': 30, '90days': 90, 'year': 365 }[period] || 30;
    const stall = await this.findById(stallId);
    const salesRequest = (await getPool()).request().input('stallId', sql.Int, stallId).input('days', sql.Int, days).input('stallName', sql.NVarChar(120), stall?.StallName || '');
    const [[salesSummary]] = (await salesRequest.query(`SELECT COUNT(*) AS TotalOrders,COALESCE(SUM(TotalAmount),0) AS TotalRevenue,COALESCE(AVG(TotalAmount),0) AS AvgOrderValue FROM dbo.Orders o JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE p.StallName=@stallName AND o.Status='Delivered' AND o.OrderDate>=DATEADD(DAY,-@days,GETDATE())`)).recordsets;
    const [[feedbackSummary]] = (await (await getPool()).request().input('stallId', sql.Int, stallId).input('days', sql.Int, days).query(`SELECT COUNT(*) AS TotalReviews,COALESCE(AVG(CAST(Rating AS DECIMAL(3,1))),0) AS AvgRating FROM dbo.Feedbacks WHERE StallId=@stallId AND CreatedAt>=DATEADD(DAY,-@days,GETDATE())`)).recordsets;
    return { period, salesSummary: { totalOrders: salesSummary.TotalOrders, totalRevenue: Number(salesSummary.TotalRevenue), avgOrderValue: Number(salesSummary.AvgOrderValue) }, feedbackSummary: { totalReviews: feedbackSummary.TotalReviews, avgRating: Number(feedbackSummary.AvgRating) } };
  }
};

module.exports = VendorStall;
