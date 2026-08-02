// tests/vendorProfile.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('VendorProfile API', () => {
  let vendorToken, profileId;

  before(async () => {
    const v = await request(app)
      .post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    vendorToken = v.body.data.token;
  });

  describe('GET /api/vendor-profile', () => {
    it('should return own profile (existing from seed)', async () => {
      const res = await request(app)
        .get('/api/vendor-profile')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('BusinessName');
      profileId = res.body.data.VendorProfileId;
    });
  });

  describe('GET /api/vendor-profile/:id', () => {
    it('should return a profile by id', async () => {
      const res = await request(app)
        .get(`/api/vendor-profile/${profileId}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('PUT /api/vendor-profile', () => {
    it('should update own profile', async () => {
      const res = await request(app)
        .put('/api/vendor-profile')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ businessName: "Uncle Chen's Pte Ltd", contactNumber: '+65 9111 2222' });
      expect(res.status).to.equal(200);
      expect(res.body.data.ContactNumber).to.equal('+65 9111 2222');
    });
  });
});
