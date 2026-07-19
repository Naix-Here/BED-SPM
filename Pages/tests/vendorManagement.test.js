// tests/vendorManagement.test.js — Unit tests for Vendor Management endpoints
const request = require('supertest');

describe('Vendor Management API', () => {
  let app;

  beforeAll(async () => {
    const express = require('express');
    app = express();
    app.use(express.json());
    app.use('/api/vendor', require('../routes/vendorManagementRoutes'));
    app.use((err, req, res, next) => res.status(err.statusCode||500).json({ error: err.message }));
  });

  // ===== MENU ITEMS =====
  describe('GET /api/vendor/menu-items', () => {
    it('should return menu items (public)', async () => {
      const res = await request(app).get('/api/vendor/menu-items');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('items');
    });

    it('should accept stall_id filter', async () => {
      const res = await request(app).get('/api/vendor/menu-items?stall_id=1');
      expect(res.status).toBe(200);
    });

    it('should search by name', async () => {
      const res = await request(app).get('/api/vendor/menu-items?search=chicken');
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/vendor/menu-items', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/vendor/menu-items')
        .send({ stall_id: 1, name: 'Test', price: 5.00 });
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/vendor/menu-items/:itemId', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .put('/api/vendor/menu-items/1')
        .send({ name: 'Updated' });
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/vendor/menu-items/:itemId', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).delete('/api/vendor/menu-items/1');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/vendor/menu-items/:itemId/like', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).post('/api/vendor/menu-items/1/like');
      expect(res.status).toBe(401);
    });
  });

  // ===== STALLS =====
  describe('GET /api/vendor/stalls', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/vendor/stalls');
      expect(res.status).toBe(401);
    });
  });

  // ===== RENTAL AGREEMENTS =====
  describe('GET /api/vendor/rental-agreements', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app).get('/api/vendor/rental-agreements');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/vendor/rental-agreements', () => {
    it('should return 401 without auth', async () => {
      const res = await request(app)
        .post('/api/vendor/rental-agreements')
        .send({ stall_id: 1, start_date: '2026-01-01', end_date: '2026-12-31', monthly_rent: 1000 });
      expect(res.status).toBe(401);
    });
  });
});
