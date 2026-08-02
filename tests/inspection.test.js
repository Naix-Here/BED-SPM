// tests/inspection.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Inspection API', () => {
  let neaToken, inspectionId;

  before(async () => {
    const n = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nea1@test.com', password: 'Password123' });
    neaToken = n.body.data.token;
  });

  describe('POST /api/inspections', () => {
    it('should create an inspection (NEA)', async () => {
      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${neaToken}`)
        .send({
          stallId: 1,
          inspectionDate: '2026-02-15',
          score: 88.5,
          remarks: 'Test inspection',
          gradeIssued: 'A',
        });
      expect(res.status).to.equal(201);
      inspectionId = res.body.data.InspectionId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/inspections')
        .send({ stallId: 1, inspectionDate: '2026-01-01', score: 80, gradeIssued: 'A' });
      expect(res.status).to.equal(401);
    });

    it('should reject non-NEA', async () => {
      const customer = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@test.com', password: 'Password123' });
      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${customer.body.data.token}`)
        .send({ stallId: 1, inspectionDate: '2026-01-01', score: 80, gradeIssued: 'A' });
      expect(res.status).to.equal(403);
    });

    it('should reject invalid score', async () => {
      const res = await request(app)
        .post('/api/inspections')
        .set('Authorization', `Bearer ${neaToken}`)
        .send({ stallId: 1, inspectionDate: '2026-01-01', score: 150, gradeIssued: 'A' });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/inspections', () => {
    it('should return list', async () => {
      const res = await request(app)
        .get('/api/inspections')
        .set('Authorization', `Bearer ${neaToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/inspections/:id', () => {
    it('should return single inspection', async () => {
      const res = await request(app)
        .get(`/api/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${neaToken}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('PUT /api/inspections/:id', () => {
    it('should update inspection', async () => {
      const res = await request(app)
        .put(`/api/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${neaToken}`)
        .send({
          inspectionDate: '2026-02-16',
          score: 91.0,
          remarks: 'Updated',
          gradeIssued: 'A',
        });
      expect(res.status).to.equal(200);
    });
  });

  describe('DELETE /api/inspections/:id', () => {
    it('should delete inspection', async () => {
      const res = await request(app)
        .delete(`/api/inspections/${inspectionId}`)
        .set('Authorization', `Bearer ${neaToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
