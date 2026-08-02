// tests/promotion.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Promotion API', () => {
  let vendorToken, promotionId;

  before(async () => {
    const v = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    vendorToken = v.body.data.token;
  });

  describe('GET /api/promotions', () => {
    it('should return active promotions (public)', async () => {
      const res = await request(app).get('/api/promotions');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('POST /api/promotions', () => {
    it('should create promotion (vendor)', async () => {
      const res = await request(app)
        .post('/api/promotions')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          stallId: 1,
          title: 'Lunch Set Deal',
          description: 'Chicken rice + drink combo',
          discountType: 'Percentage',
          discountValue: 15,
          startDate: '2026-04-01',
          endDate: '2026-06-30',
        });
      expect(res.status).to.equal(201);
      promotionId = res.body.data.PromotionId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/promotions')
        .send({ stallId: 1, title: 'x', discountType: 'Percentage', discountValue: 10, startDate: '2026-01-01', endDate: '2026-12-31' });
      expect(res.status).to.equal(401);
    });

    it('should reject invalid discount type', async () => {
      const res = await request(app)
        .post('/api/promotions')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          stallId: 1, title: 'x', discountType: 'Banana',
          discountValue: 10, startDate: '2026-01-01', endDate: '2026-12-31',
        });
      expect(res.status).to.equal(400);
    });

    it('should reject endDate <= startDate', async () => {
      const res = await request(app)
        .post('/api/promotions')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          stallId: 1, title: 'x', discountType: 'Fixed',
          discountValue: 5, startDate: '2026-06-01', endDate: '2026-05-31',
        });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/promotions/:id', () => {
    it('should return a single promotion', async () => {
      const res = await request(app).get(`/api/promotions/${promotionId}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('PUT /api/promotions/:id', () => {
    it('should update promotion', async () => {
      const res = await request(app)
        .put(`/api/promotions/${promotionId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          stallId: 1,
          title: 'Updated Deal',
          discountType: 'Fixed',
          discountValue: 3,
          startDate: '2026-04-01',
          endDate: '2026-06-30',
        });
      expect(res.status).to.equal(200);
    });
  });

  describe('DELETE /api/promotions/:id', () => {
    it('should delete promotion', async () => {
      const res = await request(app)
        .delete(`/api/promotions/${promotionId}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
