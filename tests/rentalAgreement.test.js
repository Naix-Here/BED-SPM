// tests/rentalAgreement.test.js — Tests for /api/rental-agreements.
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('RentalAgreement API', () => {
  let operatorToken;
  let vendorToken;
  let customerToken;
  let createdId;

  before(async () => {
    const o = await request(app).post('/api/auth/login')
      .send({ email: 'operator1@test.com', password: 'Password123' });
    expect(o.status).to.equal(200);
    operatorToken = o.body.data.token;

    const v = await request(app).post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    expect(v.status).to.equal(200);
    vendorToken = v.body.data.token;

    const c = await request(app).post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    expect(c.status).to.equal(200);
    customerToken = c.body.data.token;
  });

  describe('GET /api/rental-agreements', () => {
    it('should require authentication', async () => {
      const res = await request(app).get('/api/rental-agreements');
      expect(res.status).to.equal(401);
    });

    it('should reject customers', async () => {
      const res = await request(app)
        .get('/api/rental-agreements')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(403);
    });

    it('should return all agreements to operator', async () => {
      const res = await request(app)
        .get('/api/rental-agreements')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
    });

    it('should return only the vendor\'s stall agreements', async () => {
      const res = await request(app)
        .get('/api/rental-agreements')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      // Each agreement should be for a stall the vendor owns (StallId 1)
      res.body.data.forEach((a) => {
        expect([1]).to.include(a.StallId);
      });
    });
  });

  describe('GET /api/rental-agreements/:id', () => {
    it('should return a single agreement to operator', async () => {
      const res = await request(app)
        .get('/api/rental-agreements/1')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('RentalAgreementId', 1);
    });

    it('should return own agreement to vendor', async () => {
      const res = await request(app)
        .get('/api/rental-agreements/1')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
    });

    it('should 404 for missing agreement', async () => {
      const res = await request(app)
        .get('/api/rental-agreements/99999')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/rental-agreements', () => {
    it('should require auth', async () => {
      const res = await request(app)
        .post('/api/rental-agreements')
        .send({ stallId: 1, monthlyRent: 1500, startDate: '2026-02-01' });
      expect(res.status).to.equal(401);
    });

    it('should reject vendor', async () => {
      const res = await request(app)
        .post('/api/rental-agreements')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ stallId: 1, monthlyRent: 1500, startDate: '2026-02-01' });
      expect(res.status).to.equal(403);
    });

    it('should reject negative rent', async () => {
      const res = await request(app)
        .post('/api/rental-agreements')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ stallId: 1, monthlyRent: -10, startDate: '2026-02-01' });
      expect(res.status).to.equal(400);
    });

    it('should reject end date before start date', async () => {
      const res = await request(app)
        .post('/api/rental-agreements')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ stallId: 1, monthlyRent: 1500, startDate: '2026-02-01', endDate: '2025-01-01' });
      expect(res.status).to.equal(400);
    });

    it('should create a new agreement as Operator', async () => {
      const res = await request(app)
        .post('/api/rental-agreements')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          stallId: 1,
          monthlyRent: 1750.50,
          startDate: '2026-02-01',
          endDate: '2027-01-31',
          status: 'Active',
          terms: 'Auto-created by tests.',
        });
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('RentalAgreementId');
      createdId = res.body.data.RentalAgreementId;
    });
  });

  describe('PUT /api/rental-agreements/:id', () => {
    it('should update the agreement as Operator', async () => {
      if (!createdId) return;
      const res = await request(app)
        .put(`/api/rental-agreements/${createdId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          stallId: 1,
          monthlyRent: 1800,
          startDate: '2026-02-01',
          endDate: '2027-01-31',
          status: 'Active',
          terms: 'Updated by tests.',
        });
      expect(res.status).to.equal(200);
    });

    it('should reject update by vendor', async () => {
      const res = await request(app)
        .put(`/api/rental-agreements/${createdId || 1}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ stallId: 1, monthlyRent: 1, startDate: '2026-02-01' });
      expect(res.status).to.equal(403);
    });
  });

  describe('DELETE /api/rental-agreements/:id', () => {
    it('should reject deletion by vendor', async () => {
      const res = await request(app)
        .delete(`/api/rental-agreements/${createdId || 1}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(403);
    });

    it('should allow Operator to delete', async () => {
      if (!createdId) return;
      const res = await request(app)
        .delete(`/api/rental-agreements/${createdId}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
