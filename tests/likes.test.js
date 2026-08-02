// tests/likes.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Likes API', () => {
  let customerToken;
  let likeId;

  before(async () => {
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
  });

  describe('POST /api/likes', () => {
    it('should like a menu item', async () => {
      const res = await request(app)
        .post('/api/likes')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ menuItemId: 2 });
      if (res.status === 409) {
        // Already liked — fetch existing id from list
        const list = await request(app)
          .get('/api/likes?menuItemId=2')
          .set('Authorization', `Bearer ${customerToken}`);
        likeId = list.body.data[0].LikeId;
        return;
      }
      expect(res.status).to.equal(201);
      likeId = res.body.data.LikeId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/likes')
        .send({ menuItemId: 2 });
      expect(res.status).to.equal(401);
    });

    it('should reject invalid menuItemId', async () => {
      const res = await request(app)
        .post('/api/likes')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ menuItemId: 'abc' });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/likes', () => {
    it('should return list', async () => {
      const res = await request(app)
        .get('/api/likes')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/likes/count/:menuItemId', () => {
    it('should return like count', async () => {
      const res = await request(app)
        .get('/api/likes/count/1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('likeCount');
    });
  });

  describe('GET /api/likes/check/:menuItemId', () => {
    it('should report whether the customer liked', async () => {
      const res = await request(app)
        .get('/api/likes/check/1')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('liked');
    });
  });

  describe('DELETE /api/likes/:id', () => {
    it('should remove the like', async () => {
      if (!likeId) return;
      const res = await request(app)
        .delete(`/api/likes/${likeId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
    });
  });
});
