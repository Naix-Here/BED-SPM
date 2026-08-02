// tests/stall.test.js — Tests for /api/stalls.
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Stall API', () => {
  let operatorToken;
  let vendorToken;
  let customerToken;
  let createdStallId;

  before(async () => {
    const opRes = await request(app).post('/api/auth/login')
      .send({ email: 'operator1@test.com', password: 'Password123' });
    expect(opRes.status).to.equal(200);
    operatorToken = opRes.body.data.token;

    const vendorRes = await request(app).post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    expect(vendorRes.status).to.equal(200);
    vendorToken = vendorRes.body.data.token;

    const custRes = await request(app).post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    expect(custRes.status).to.equal(200);
    customerToken = custRes.body.data.token;
  });

  describe('GET /api/stalls (public)', () => {
    it('should return a list of stalls without auth', async () => {
      const res = await request(app).get('/api/stalls');
      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
    });

    it('should include OwnerName and CurrentHygieneGrade', async () => {
      const res = await request(app).get('/api/stalls');
      const first = res.body.data[0];
      expect(first).to.have.property('OwnerName');
      expect(first).to.have.property('HawkerCentreName');
    });

    it('should filter by hawkerCentreId', async () => {
      const res = await request(app).get('/api/stalls?hawkerCentreId=1');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach((s) => {
        expect(s.HawkerCentreId).to.equal(1);
      });
    });
  });

  describe('GET /api/stalls/:id', () => {
    it('should return stall details with cuisines', async () => {
      const res = await request(app).get('/api/stalls/1');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('StallId', 1);
      expect(res.body.data).to.have.property('OwnerName');
      expect(res.body.data).to.have.property('Cuisines');
      expect(res.body.data.Cuisines).to.be.an('array');
    });

    it('should return 404 for non-existent stall', async () => {
      const res = await request(app).get('/api/stalls/99999');
      expect(res.status).to.equal(404);
    });

    it('should return 400 for invalid stall id', async () => {
      const res = await request(app).get('/api/stalls/abc');
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/stalls/:id/menu', () => {
    it('should return menu items for a stall', async () => {
      const res = await request(app).get('/api/stalls/1/menu');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
      const first = res.body.data[0];
      expect(first).to.have.property('StallId', 1);
      expect(first).to.have.property('Name');
    });
  });

  describe('POST /api/stalls', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/stalls')
        .send({ hawkerCentreId: 1, ownerId: 3, name: 'X', unitNumber: 'X' });
      expect(res.status).to.equal(401);
    });

    it('should reject creation by Customer', async () => {
      const res = await request(app)
        .post('/api/stalls')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ hawkerCentreId: 1, ownerId: 3, name: 'X', unitNumber: 'X' });
      expect(res.status).to.equal(403);
    });

    it('should reject invalid hawker centre id', async () => {
      const res = await request(app)
        .post('/api/stalls')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ hawkerCentreId: 99999, ownerId: 3, name: 'Bad', unitNumber: 'X' });
      expect(res.status).to.equal(400);
    });

    it('should reject non-vendor owner', async () => {
      const res = await request(app)
        .post('/api/stalls')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ hawkerCentreId: 1, ownerId: 1, name: 'Bad', unitNumber: 'X' });
      expect(res.status).to.equal(400);
    });

    it('should create a stall as Operator', async () => {
      const res = await request(app)
        .post('/api/stalls')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          hawkerCentreId: 1,
          ownerId: 3,
          name: 'Test Stall X',
          description: 'Automated test stall.',
          unitNumber: 'T-99',
        });
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('StallId');
      createdStallId = res.body.data.StallId;
    });
  });

  describe('PUT /api/stalls/:id', () => {
    it('should allow vendor to update own stall', async () => {
      const res = await request(app)
        .put('/api/stalls/1')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'Updated Hainan Chicken', unitNumber: '#01-10', status: 'Active' });
      expect(res.status).to.equal(200);
    });

    it('should reject vendor updating other vendor\'s stall', async () => {
      const res = await request(app)
        .put('/api/stalls/2')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ name: 'Hack', unitNumber: 'X', status: 'Active' });
      expect(res.status).to.equal(403);
    });

    it('should return 404 for missing stall', async () => {
      const res = await request(app)
        .put('/api/stalls/99999')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: 'X', unitNumber: 'X', status: 'Active' });
      expect(res.status).to.equal(404);
    });
  });

  describe('GET /api/stalls/:id/performance', () => {
    it('should return performance for the stall owner', async () => {
      const res = await request(app)
        .get('/api/stalls/1/performance')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('totalOrders');
      expect(res.body.data).to.have.property('averageRating');
      expect(res.body.data).to.have.property('revenue');
    });

    it('should reject vendor requesting another stall\'s performance', async () => {
      const res = await request(app)
        .get('/api/stalls/2/performance')
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(403);
    });

    it('should reject unauthenticated access', async () => {
      const res = await request(app).get('/api/stalls/1/performance');
      expect(res.status).to.equal(401);
    });
  });

  describe('DELETE /api/stalls/:id', () => {
    it('should reject deletion by Customer', async () => {
      const res = await request(app)
        .delete(`/api/stalls/${createdStallId || 1}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(403);
    });

    it('should reject deletion by Vendor', async () => {
      const res = await request(app)
        .delete(`/api/stalls/${createdStallId || 1}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(403);
    });

    it('should allow Operator to delete', async () => {
      if (!createdStallId) return;
      const res = await request(app)
        .delete(`/api/stalls/${createdStallId}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
