// models/orderHistoryModel.js — Order history, feedback, guest orders, stats
const { sql, getPool } = require('../config/database');

const OrderHistory = {
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status, sortBy = 'OrderDate', order = 'DESC' } = options;
    const safeCols = ['OrderDate', 'TotalAmount', 'Status', 'OrderId'];
    const col = safeCols.includes(sortBy) ? sortBy : 'OrderDate';
    const dir = order === 'ASC' ? 'ASC' : 'DESC';
    const offset = (page - 1) * limit;
    let where = 'WHERE o.UserId = @userId';
    const request = (await getPool()).request().input('userId', sql.Int, userId).input('limit', sql.Int, limit).input('offset', sql.Int, offset);
    if (status) { where += ' AND o.Status = @status'; request.input('status', sql.VarChar(20), status); }
    const [[{ total }]] = (await (await getPool()).request().input('userId', sql.Int, userId).input('status', status || '').query(`SELECT COUNT(*) AS total FROM dbo.Orders o WHERE o.UserId = @userId${status ? ' AND o.Status = @status' : ''}`)).recordsets;
    const orders = (await request.query(`SELECT o.OrderId,o.OrderDate,o.TotalAmount,o.Status,o.DeliveryAddress,o.OrderDate AS CreatedAt FROM dbo.Orders o ${where} ORDER BY o.${col} ${dir} OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`)).recordset;
    for (const order of orders) {
      order.Items = (await (await getPool()).request().input('orderId', sql.Int, order.OrderId).query(`SELECT oi.OrderItemId,oi.ProductId,p.ProductName AS ItemName,oi.Quantity,oi.UnitPrice,oi.Quantity*oi.UnitPrice AS Subtotal FROM dbo.OrderItems oi JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE oi.OrderId=@orderId`)).recordset;
      order.Feedback = (await (await getPool()).request().input('orderId', sql.Int, order.OrderId).query(`SELECT FeedbackId,Rating,Comment,CreatedAt FROM dbo.Feedbacks WHERE OrderId=@orderId`)).recordset[0] || null;
    }
    return { orders, pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasMore: page * limit < total } };
  },

  async findByGuestSession(sessionId) {
    return (await (await getPool()).request().input('sessionId', sql.NVarChar(100), sessionId).query(`SELECT o.OrderId,o.OrderDate,o.TotalAmount,o.Status,p.ProductName AS ItemName FROM dbo.Orders o JOIN dbo.OrderItems oi ON oi.OrderId=o.OrderId JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE o.GuestSessionId=@sessionId ORDER BY o.OrderDate DESC`)).recordset;
  },

  async findById(orderId) {
    const order = (await (await getPool()).request().input('orderId', sql.Int, orderId).query(`SELECT o.* FROM dbo.Orders o WHERE o.OrderId=@orderId`)).recordset[0] || null;
    if (!order) return null;
    order.Items = (await (await getPool()).request().input('orderId', sql.Int, orderId).query(`SELECT oi.*,p.ProductName AS ItemName FROM dbo.OrderItems oi JOIN dbo.Products p ON p.ProductId=oi.ProductId WHERE oi.OrderId=@orderId`)).recordset;
    order.Feedback = (await (await getPool()).request().input('orderId', sql.Int, orderId).query(`SELECT * FROM dbo.Feedbacks WHERE OrderId=@orderId`)).recordset[0] || null;
    return order;
  },

  async cancelOrder(orderId, userId) {
    const order = (await (await getPool()).request().input('orderId', sql.Int, orderId).input('userId', sql.Int, userId).query(`SELECT * FROM dbo.Orders WHERE OrderId=@orderId AND UserId=@userId`)).recordset[0];
    if (!order) throw new (require('../utils/AppError'))('Order not found or access denied.', 404);
    if (!['Pending', 'Preparing'].includes(order.Status)) throw new (require('../utils/AppError'))(`Cannot cancel order with status "${order.Status}". Only pending or preparing orders can be cancelled.`, 400);
    await (await getPool()).request().input('orderId', sql.Int, orderId).query(`UPDATE dbo.Orders SET Status='Cancelled' WHERE OrderId=@orderId`);
    return { orderId, previousStatus: order.Status, newStatus: 'Cancelled', message: 'Order cancelled successfully.' };
  },

  async submitFeedback(orderId, userId, { rating, comment }) {
    const order = (await (await getPool()).request().input('orderId', sql.Int, orderId).input('userId', sql.Int, userId).query(`SELECT * FROM dbo.Orders WHERE OrderId=@orderId AND UserId=@userId`)).recordset[0];
    if (!order) throw new (require('../utils/AppError'))('Order not found or access denied.', 404);
    const existing = (await (await getPool()).request().input('orderId', sql.Int, orderId).input('userId', sql.Int, userId).query(`SELECT * FROM dbo.Feedbacks WHERE OrderId=@orderId AND UserId=@userId`)).recordset[0];
    if (existing) {
      await (await getPool()).request().input('feedbackId', sql.Int, existing.FeedbackId).input('rating', sql.Int, rating).input('comment', sql.NVarChar(1000), comment || null).query(`UPDATE dbo.Feedbacks SET Rating=@rating,Comment=@comment WHERE FeedbackId=@feedbackId`);
      return { ...existing, rating, comment, updated: true };
    }
    const result = await (await getPool()).request().input('orderId', sql.Int, orderId).input('userId', sql.Int, userId).input('stallId', sql.Int, 1).input('rating', sql.Int, rating).input('comment', sql.NVarChar(1000), comment || null).query(`INSERT INTO dbo.Feedbacks (OrderId,UserId,StallId,Rating,Comment) OUTPUT INSERTED.FeedbackId VALUES (@orderId,@userId,@stallId,@rating,@comment)`);
    return { feedbackId: result.recordset[0].FeedbackId, orderId, rating, comment, created: true };
  },

  async getUserStats(userId) {
    const [[{ totalOrders }]] = (await (await getPool()).request().input('userId', sql.Int, userId).query(`SELECT COUNT(*) AS totalOrders FROM dbo.Orders WHERE UserId=@userId`)).recordsets;
    const [[{ totalSpent }]] = (await (await getPool()).request().input('userId', sql.Int, userId).query(`SELECT COALESCE(SUM(TotalAmount),0) AS totalSpent FROM dbo.Orders WHERE UserId=@userId AND Status='Delivered'`)).recordsets;
    const statusBreakdown = (await (await getPool()).request().input('userId', sql.Int, userId).query(`SELECT Status,COUNT(*) AS count FROM dbo.Orders WHERE UserId=@userId GROUP BY Status`)).recordset;
    return { totalOrders, totalSpent: Number(totalSpent), statusBreakdown };
  }
};

module.exports = OrderHistory;
