// tests/customerProfile.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('CustomerProfile API', () => {
  let customerToken, profileId;

  before(async () => {
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
  });

  describe('GET /api/customer-profile', () => {
    it('should return own profile (existing from seed)', async () => {
      const res = await request(app)
        .get('/api/customer-profile')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('LoyaltyPoints');
      profileId = res.body.data.CustomerProfileId;
    });
  });

  describe('GET /api/customer-profile/:id', () => {
    it('should return a profile by id', async () => {
      const res = await request(app)
        .get(`/api/customer-profile/${profileId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('PUT /api/customer-profile', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .put('/api/customer-profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ phone: '+65 9999 8888', preferredLanguage: 'en', loyaltyPoints: 175 });
      expect(res.status).to.equal(200);
      expect(res.body.data.LoyaltyPoints).to.equal(175);
    });

    it('should reject invalid language', async () => {
      const res = await request(app)
        .put('/api/customer-profile')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ preferredLanguage: 'jp' });
      expect(res.status).to.equal(400);
    });
  });
});
