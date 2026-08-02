// tests/complaint.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Complaint API', () => {
  let customerToken, operatorToken, complaintId;

  before(async () => {
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
    const o = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator1@test.com', password: 'Password123' });
    operatorToken = o.body.data.token;
  });

  describe('POST /api/complaints', () => {
    it('should create complaint (customer)', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 1, subject: 'Long wait', description: '40 minutes for a $5 plate.' });
      expect(res.status).to.equal(201);
      complaintId = res.body.data.ComplaintId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .send({ stallId: 1, subject: 'x', description: 'y' });
      expect(res.status).to.equal(401);
    });

    it('should reject missing subject', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 1, description: 'no subject' });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/complaints/mine', () => {
    it('should return my complaints', async () => {
      const res = await request(app)
        .get('/api/complaints/mine')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/complaints', () => {
    it('should return all complaints (operator)', async () => {
      const res = await request(app)
        .get('/api/complaints')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/complaints/:id', () => {
    it('should return single complaint', async () => {
      const res = await request(app)
        .get(`/api/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
    });

    it('should 404 for missing', async () => {
      const res = await request(app)
        .get('/api/complaints/99999')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/complaints/:id', () => {
    it('should update status (operator)', async () => {
      const res = await request(app)
        .put(`/api/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'Investigating' });
      expect(res.status).to.equal(200);
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .put(`/api/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'Banana' });
      expect(res.status).to.equal(400);
    });
  });

  describe('DELETE /api/complaints/:id', () => {
    it('should delete complaint (operator)', async () => {
      const res = await request(app)
        .delete(`/api/complaints/${complaintId}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
