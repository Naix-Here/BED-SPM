// tests/menuItem.test.js — Tests for /api/menu-items.
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('MenuItem API', () => {
  let vendorToken;
  let customerToken;
  let createdItemId;

  before(async () => {
    const v = await request(app).post('/api/auth/login')
      .send({ email: 'vendor1@test.com', password: 'Password123' });
    expect(v.status).to.equal(200);
    vendorToken = v.body.data.token;

    const c = await request(app).post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    expect(c.status).to.equal(200);
    customerToken = c.body.data.token;
  });

  describe('GET /api/menu-items (public)', () => {
    it('should return a list of menu items without auth', async () => {
      const res = await request(app).get('/api/menu-items');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
    });

    it('should filter by stallId', async () => {
      const res = await request(app).get('/api/menu-items?stallId=1');
      expect(res.status).to.equal(200);
      res.body.data.forEach((it) => {
        expect(it.StallId).to.equal(1);
      });
    });
  });

  describe('GET /api/menu-items/:id', () => {
    it('should return item details with cuisines', async () => {
      const res = await request(app).get('/api/menu-items/1');
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('MenuItemId', 1);
      expect(res.body.data).to.have.property('Cuisines');
      expect(res.body.data.Cuisines).to.be.an('array');
    });

    it('should return 404 for missing item', async () => {
      const res = await request(app).get('/api/menu-items/99999');
      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/menu-items', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .send({ stallId: 1, name: 'Test', price: 5, category: 'Main' });
      expect(res.status).to.equal(401);
    });

    it('should reject Customer role', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 1, name: 'X', price: 1, category: 'Main' });
      expect(res.status).to.equal(403);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ stallId: 1 });
      expect(res.status).to.equal(400);
    });

    it('should reject invalid price', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ stallId: 1, name: 'X', price: -1, category: 'Main' });
      expect(res.status).to.equal(400);
    });

    it('should reject invalid category', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ stallId: 1, name: 'X', price: 1, category: 'Invalid' });
      expect(res.status).to.equal(400);
    });

    it('should create an item owned by the vendor', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          stallId: 1,
          name: 'Test Dish ' + Date.now(),
          description: 'Created by tests.',
          price: 6.5,
          category: 'Main',
          cuisineIds: [1],
        });
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('MenuItemId');
      expect(res.body.data).to.have.property('Cuisines');
      expect(res.body.data.Cuisines.length).to.equal(1);
      createdItemId = res.body.data.MenuItemId;
    });

    it('should reject vendor creating item on another vendor\'s stall', async () => {
      const res = await request(app)
        .post('/api/menu-items')
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ stallId: 2, name: 'X', price: 1, category: 'Main' });
      expect(res.status).to.equal(403);
    });
  });

  describe('PUT /api/menu-items/:id', () => {
    it('should allow the owner vendor to update', async () => {
      if (!createdItemId) return;
      const res = await request(app)
        .put(`/api/menu-items/${createdItemId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({
          stallId: 1,
          name: 'Updated Test Dish',
          price: 7.0,
          category: 'Main',
          isAvailable: true,
        });
      expect(res.status).to.equal(200);
      expect(res.body.data.Name).to.equal('Updated Test Dish');
    });

    it('should reject update by a different vendor', async () => {
      const res = await request(app)
        .put('/api/menu-items/1')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          stallId: 1, name: 'Hacker', price: 1, category: 'Main',
        });
      expect(res.status).to.equal(403);
    });
  });

  describe('DELETE /api/menu-items/:id', () => {
    it('should reject Customer deletion', async () => {
      const res = await request(app)
        .delete(`/api/menu-items/${createdItemId || 1}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(403);
    });

    it('should allow owner vendor to delete', async () => {
      if (!createdItemId) return;
      const res = await request(app)
        .delete(`/api/menu-items/${createdItemId}`)
        .set('Authorization', `Bearer ${vendorToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
