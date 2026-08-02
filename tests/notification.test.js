// tests/notification.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Notification API', () => {
  let customerToken, notifId;

  before(async () => {
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
  });

  describe('POST /api/notifications', () => {
    it('should create a notification', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ userId: 1, title: 'Test', message: 'Hello', type: 'Test' });
      expect(res.status).to.equal(201);
      notifId = res.body.data.NotificationId;
    });

    it('should reject without auth', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ userId: 1, title: 'x', message: 'y', type: 'z' });
      expect(res.status).to.equal(401);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ userId: 1 });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/notifications', () => {
    it('should return user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    it('should return unread count', async () => {
      const res = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('unreadCount');
    });
  });

  describe('PUT /api/notifications/:id', () => {
    it('should mark notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notifId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isRead: true });
      expect(res.status).to.equal(200);
    });
  });

  describe('PUT /api/notifications/mark-all-read', () => {
    it('should mark all as read', async () => {
      const res = await request(app)
        .put('/api/notifications/mark-all-read')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${notifId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
