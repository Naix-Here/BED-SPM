// tests/orderItem.test.js — Tests for /api/order-items.
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('OrderItem API', () => {
  let vendorToken;
  let customer1Token;
  let customer2Token;
  let operatorToken;
  let pendingOrderId;
  let createdItemId;

  before(async () => {
    const login = async (email) => {
      const res = await request(app).post('/api/auth/login')
        .send({ email, password: 'Password123' });
      expect(res.status).to.equal(200);
      return res.body.data.token;
    };
    vendorToken   = await login('vendor1@test.com');
    customer1Token = await login('customer1@test.com');
    customer2Token = await login('customer2@test.com');
    operatorToken = await login('operator1@test.com');

    // Create a fresh pending order for our tests
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ stallId: 1, totalAmount: 1.0 });
    if (orderRes.status === 201) {
      pendingOrderId = orderRes.body.data.OrderId;
    } else {
      pendingOrderId = 1; // fallback to the seeded Pending order
    }
  });

  describe('GET /api/order-items', () => {
    it('should require orderId query', async () => {
      const res = await request(app)
        .get('/api/order-items')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(400);
    });

    it('should require auth', async () => {
      const res = await request(app).get(`/api/order-items?orderId=${pendingOrderId}`);
      expect(res.status).to.equal(401);
    });

    it('should reject customer from another customer\'s order', async () => {
      const res = await request(app)
        .get('/api/order-items?orderId=4') // owned by customer3
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(403);
    });

    it('should return items for the owner', async () => {
      const res = await request(app)
        .get(`/api/order-items?orderId=1`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
    });
  });

  describe('GET /api/order-items/:id', () => {
    it('should return a single order item', async () => {
      const res = await request(app)
        .get('/api/order-items/1')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('OrderItemId', 1);
    });

    it('should return 404 for missing item', async () => {
      const res = await request(app)
        .get('/api/order-items/99999')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/order-items', () => {
    it('should reject unauthenticated', async () => {
      const res = await request(app)
        .post('/api/order-items')
        .send({ orderId: pendingOrderId, menuItemId: 1, quantity: 1 });
      expect(res.status).to.equal(401);
    });

    it('should reject negative quantity', async () => {
      const res = await request(app)
        .post('/api/order-items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ orderId: pendingOrderId, menuItemId: 1, quantity: -1 });
      expect(res.status).to.equal(400);
    });

    it('should reject menu item from another stall', async () => {
      const res = await request(app)
        .post('/api/order-items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ orderId: pendingOrderId, menuItemId: 6, quantity: 1 });
      expect(res.status).to.equal(400);
    });

    it('should add an item to a pending order', async () => {
      const res = await request(app)
        .post('/api/order-items')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          orderId: pendingOrderId,
          menuItemId: 2,
          quantity: 2,
          addOns: 'Extra ginger',
          addOnCharge: 0.5,
        });
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('OrderItemId');
      expect(res.body.data.Quantity).to.equal(2);
      expect(Number(res.body.data.UnitPrice)).to.be.greaterThan(0);
      createdItemId = res.body.data.OrderItemId;
    });

    it('should reject items added to a non-Pending order', async () => {
      // Order 2 is in 'Preparing' state
      const res = await request(app)
        .post('/api/order-items')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ orderId: 2, menuItemId: 6, quantity: 1 });
      expect(res.status).to.equal(400);
    });
  });

  describe('PUT /api/order-items/:id', () => {
    it('should update item quantity', async () => {
      if (!createdItemId) return;
      const res = await request(app)
        .put(`/api/order-items/${createdItemId}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ quantity: 3 });
      expect(res.status).to.equal(200);
      expect(res.body.data.Quantity).to.equal(3);
    });

    it('should reject update by vendor', async () => {
      if (!createdItemId) return;
      const res = await request(app)
        .put(`/api/order-items/${createdItemId}`)
        .set('Authorization', `Bearer ${vendorToken}`)
        .send({ quantity: 5 });
      expect(res.status).to.equal(403);
    });
  });

  describe('DELETE /api/order-items/:id', () => {
    it('should reject deletion by another customer', async () => {
      if (!createdItemId) return;
      const res = await request(app)
        .delete(`/api/order-items/${createdItemId}`)
        .set('Authorization', `Bearer ${customer2Token}`);
      expect(res.status).to.equal(403);
    });

    it('should allow the customer to remove an item', async () => {
      if (!createdItemId) return;
      const res = await request(app)
        .delete(`/api/order-items/${createdItemId}`)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(200);
    });
  });
});
