// tests/feedback.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Feedback API', () => {
  let customerToken, operatorToken, feedbackId;

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

  describe('POST /api/feedback', () => {
    it('should create feedback with valid data', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 1, rating: 5, comment: 'Great food!' });
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('FeedbackId');
      feedbackId = res.body.data.FeedbackId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .send({ stallId: 1, rating: 5 });
      expect(res.status).to.equal(401);
    });

    it('should reject invalid rating', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 1, rating: 10 });
      expect(res.status).to.equal(400);
    });

    it('should reject missing stall', async () => {
      const res = await request(app)
        .post('/api/feedback')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 4 });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/feedback', () => {
    it('should return list', async () => {
      const res = await request(app)
        .get('/api/feedback')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });

    it('should filter by stallId', async () => {
      const res = await request(app)
        .get('/api/feedback?stallId=1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/feedback/:id', () => {
    it('should return a single feedback', async () => {
      const res = await request(app)
        .get(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('FeedbackId', feedbackId);
    });

    it('should 404 for non-existent', async () => {
      const res = await request(app)
        .get('/api/feedback/99999')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(404);
    });
  });

  describe('PUT /api/feedback/:id', () => {
    it('should update own feedback', async () => {
      const res = await request(app)
        .put(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ rating: 4, comment: 'Updated comment' });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });

  describe('DELETE /api/feedback/:id', () => {
    it('should delete feedback', async () => {
      const res = await request(app)
        .delete(`/api/feedback/${feedbackId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });

    it('should 404 for non-existent', async () => {
      const res = await request(app)
        .delete('/api/feedback/99999')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(404);
    });
  });
});
