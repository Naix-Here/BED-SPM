// tests/hygieneGrade.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('HygieneGrade API', () => {
  let neaToken, gradeId;

  before(async () => {
    const n = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nea1@test.com', password: 'Password123' });
    neaToken = n.body.data.token;
  });

  describe('POST /api/hygiene-grades', () => {
    it('should create grade (NEA)', async () => {
      const res = await request(app)
        .post('/api/hygiene-grades')
        .set('Authorization', `Bearer ${neaToken}`)
        .send({
          stallId: 2,
          grade: 'A',
          issuedDate: '2026-03-01',
          expiryDate: '2027-03-01',
        });
      expect(res.status).to.equal(201);
      gradeId = res.body.data.HygieneGradeId;
    });

    it('should reject invalid grade', async () => {
      const res = await request(app)
        .post('/api/hygiene-grades')
        .set('Authorization', `Bearer ${neaToken}`)
        .send({ stallId: 1, grade: 'Z', issuedDate: '2026-01-01', expiryDate: '2027-01-01' });
      expect(res.status).to.equal(400);
    });

    it('should reject expiry <= issued', async () => {
      const res = await request(app)
        .post('/api/hygiene-grades')
        .set('Authorization', `Bearer ${neaToken}`)
        .send({ stallId: 1, grade: 'A', issuedDate: '2026-01-01', expiryDate: '2025-01-01' });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/hygiene-grades', () => {
    it('should return list', async () => {
      const res = await request(app)
        .get('/api/hygiene-grades')
        .set('Authorization', `Bearer ${neaToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/hygiene-grades/stall/:stallId', () => {
    it('should return history for a stall', async () => {
      const res = await request(app)
        .get('/api/hygiene-grades/stall/1')
        .set('Authorization', `Bearer ${neaToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('PUT /api/hygiene-grades/:id', () => {
    it('should update grade', async () => {
      const res = await request(app)
        .put(`/api/hygiene-grades/${gradeId}`)
        .set('Authorization', `Bearer ${neaToken}`)
        .send({ stallId: 2, grade: 'B', issuedDate: '2026-03-01', expiryDate: '2027-03-01' });
      expect(res.status).to.equal(200);
    });
  });

  describe('DELETE /api/hygiene-grades/:id', () => {
    it('should delete grade', async () => {
      const res = await request(app)
        .delete(`/api/hygiene-grades/${gradeId}`)
        .set('Authorization', `Bearer ${neaToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
