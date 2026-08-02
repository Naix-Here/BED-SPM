// tests/cart.test.js
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Cart API', () => {
  let customerToken, cartId, cartItemId;
  const sessionId = 'test-session-' + Date.now();

  before(async () => {
    const c = await request(app)
      .post('/api/auth/login')
      .send({ email: 'customer1@test.com', password: 'Password123' });
    customerToken = c.body.data.token;
  });

  describe('POST /api/cart', () => {
    it('should create or return existing cart', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ stallId: 3 });
      expect([200, 201]).to.include(res.status);
      cartId = res.body.data.CartId;
    });

    it('should reject missing stall', async () => {
      const res = await request(app)
        .post('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({});
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/cart', () => {
    it('should return user carts', async () => {
      const res = await request(app)
        .get('/api/cart')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('POST /api/cart-items', () => {
    it('should add item to cart', async () => {
      const res = await request(app)
        .post('/api/cart-items')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ cartId, menuItemId: 11, quantity: 2 });
      expect(res.status).to.equal(201);
      cartItemId = res.body.data.CartItemId;
    });
  });

  describe('GET /api/cart-items', () => {
    it('should list items', async () => {
      const res = await request(app)
        .get(`/api/cart-items?cartId=${cartId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });

    it('should 400 without cartId', async () => {
      const res = await request(app)
        .get('/api/cart-items')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/cart-items/:id', () => {
    it('should update item', async () => {
      const res = await request(app)
        .put(`/api/cart-items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ quantity: 3 });
      expect(res.status).to.equal(200);
    });
  });

  describe('DELETE /api/cart-items/:id', () => {
    it('should remove item', async () => {
      const res = await request(app)
        .delete(`/api/cart-items/${cartItemId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('GET /api/cart/:id', () => {
    it('should return cart with items', async () => {
      const res = await request(app)
        .get(`/api/cart/${cartId}`)
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('Items');
    });
  });
});
