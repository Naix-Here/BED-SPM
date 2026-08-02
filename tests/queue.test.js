// tests/queue.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Queue API', () => {
  let customerToken, vendorToken, entryId;

  before(async () => {
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
    const v = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    vendorToken = v.body.data.token;
  });

  describe('POST /api/queue', () => {
    it('should join queue (customer)', async () => {
      const res = await request(app)
        .post('/api/queue')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 2 });
      // May be 201 or 409 if already in queue from seed
      expect([201, 409]).to.include(res.status);
      if (res.status === 201) entryId = res.body.data.QueueEntryId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/queue')
        .send({ stallId: 1 });
      expect(res.status).to.equal(401);
    });

    it('should reject missing stallId', async () => {
      const res = await request(app)
        .post('/api/queue')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/queue', () => {
    it('should return list', async () => {
      const res = await request(app)
        .get('/api/queue')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/queue/stall/:stallId/status', () => {
    it('should return stall queue status', async () => {
      const res = await request(app)
        .get('/api/queue/stall/1/status')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('WaitingCount');
    });
  });
});
