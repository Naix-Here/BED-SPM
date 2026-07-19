// tests/orderHistory.test.js — Unit tests for Order History endpoints
const request = require('supertest');
// Note: Create a test version of start.js that doesn't listen, or use app directly
// These tests assume a test helper that exports the configured app

describe('Order History API', () => {
  let app;

  beforeAll(async () => {
    // Dynamically create a test app matching start.js
    const express = require('express');
    const path = require('path');
    app = express();
    app.use(express.json());
    app.use('/api/orders', require('../routes/orderHistoryRoutes'));
    app.use((err, req, res, next) => res.status(err.statusCode||500).json({ error: err.message }));
  });

  describe('GET /api/orders/my-orders', () => {
    it('should return 401 without auth token', async () => {
      const res = await request(app).get('/api/orders/my-orders');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', 'Bearer invalid-token-here');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/guest', () => {
    it('should return 400 without session ID', async () => {
      const res = await request(app).get('/api/orders/guest');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('session');
    });
  });

  describe('GET /api/orders/:orderId', () => {
    it('should return 400 for invalid ID', async () => {
      const res = await request(app)
        .get('/api/orders/abc')
        .set('Authorization', 'Bearer test');
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/orders/:orderId', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/orders/1');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/orders/:orderId/feedback', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/orders/1/feedback')
        .send({ rating: 5 });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/orders/stats', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/orders/stats');
      expect(res.status).toBe(401);
    });
  });
});
