// tests/orderStatusLog.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('OrderStatusLog API', () => {
  let vendorToken, customerToken;
  const testOrderId = 4; // Known seed order ID for vendor 1 (user 3)

  before(async () => {
    const v = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    vendorToken = v.body.data.token;
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
  });

  describe('GET /api/order-status-logs', () => {
    it('should return logs for an order', async () => {
      const res = await request(app)
        .get(`/api/order-status-logs?orderId=${testOrderId}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });

    it('should 400 without orderId', async () => {
      const res = await request(app)
        .get('/api/order-status-logs')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/order-status-logs/order/:orderId', () => {
    it('should return full history', async () => {
      const res = await request(app)
        .get(`/api/order-status-logs/order/${testOrderId}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('POST /api/order-status-logs', () => {
    it('should create a log (vendor)', async () => {
      const res = await request(app)
        .post('/api/order-status-logs')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ orderId: testOrderId, status: 'Preparing', changedBy: 3 });
      expect(res.status).to.equal(201);
    });

    it('should reject customer', async () => {
      const res = await request(app)
        .post('/api/order-status-logs')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ orderId: testOrderId, status: 'Preparing' });
      expect(res.status).to.equal(403);
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .post('/api/order-status-logs')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ orderId: testOrderId, status: 'Floating' });
      expect(res.status).to.equal(400);
    });
  });
});
