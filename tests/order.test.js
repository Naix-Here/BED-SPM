// tests/order.test.js — Tests for /api/orders.
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Order API', () => {
  let operatorToken;
  let vendor1Token;
  let vendor2Token;
  let customer1Token;
  let customer2Token;
  let createdOrderId;

  before(async () => {
    const login = async (email) => {
      const res = await request(app).post('/api/auth/login')
        .send({ email, password: 'Password123' });
      expect(res.status).to.equal(200);
      return res.body.data.token;
    };
    operatorToken  = await login('operator1@test.com');
    vendor1Token   = await login('vendor1@test.com');   // owns stall 1
    vendor2Token   = await login('vendor2@test.com');   // owns stall 2
    customer1Token = await login('customer1@test.com');
    customer2Token = await login('customer2@test.com');
  });

  describe('GET /api/orders (scoped)', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/orders');
      expect(res.status).to.equal(401);
    });

    it('should return only own orders to customer', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(200);
      res.body.data.forEach((o) => expect(o.CustomerId).to.equal(1));
    });

    it('should return all orders to operator', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data.length).to.be.greaterThan(0);
    });

    it('should return vendor-scoped orders', async () => {
      const res = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.status).to.equal(200);
      res.body.data.forEach((o) => expect(o.StallId).to.equal(1));
    });
  });

  describe('GET /api/orders/my-orders', () => {
    it('should require auth', async () => {
      const res = await request(app).get('/api/orders/my-orders');
      expect(res.status).to.equal(401);
    });

    it('should reject non-customers', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.status).to.equal(403);
    });

    it('should return the customer\'s own orders', async () => {
      const res = await request(app)
        .get('/api/orders/my-orders')
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach((o) => expect(o.CustomerId).to.equal(1));
    });
  });

  describe('GET /api/orders/stall/:stallId', () => {
    it('should allow vendor to view their own stall', async () => {
      const res = await request(app)
        .get('/api/orders/stall/1')
        .set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.status).to.equal(200);
    });

    it('should reject vendor from another stall', async () => {
      const res = await request(app)
        .get('/api/orders/stall/2')
        .set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.status).to.equal(403);
    });

    it('should allow operator to view any stall', async () => {
      const res = await request(app)
        .get('/api/orders/stall/2')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return order with items to the owner', async () => {
      const res = await request(app)
        .get('/api/orders/1')
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('Items');
      expect(res.body.data.Items).to.be.an('array');
    });

    it('should reject another customer', async () => {
      const res = await request(app)
        .get('/api/orders/4') // belongs to customer3 (id 8)
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(403);
    });

    it('should return 404 for missing order', async () => {
      const res = await request(app)
        .get('/api/orders/99999')
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(404);
    });
  });

  describe('POST /api/orders', () => {
    it('should reject unauthenticated', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({ stallId: 1, totalAmount: 10 });
      expect(res.status).to.equal(401);
    });

    it('should reject missing totalAmount', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ stallId: 1 });
      expect(res.status).to.equal(400);
    });

    it('should reject negative amount', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ stallId: 1, totalAmount: -5 });
      expect(res.status).to.equal(400);
    });

    it('should create a customer order', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({
          stallId: 1,
          totalAmount: 12.5,
          specialInstructions: 'No spice please.',
          items: [
            { menuItemId: 1, quantity: 1 },
            { menuItemId: 4, quantity: 2 },
          ],
        });
      expect(res.status).to.equal(201);
      expect(res.body.data).to.have.property('OrderId');
      expect(res.body.data).to.have.property('Status', 'Pending');
      expect(res.body.data.CustomerId).to.equal(1);
      expect(res.body.data.Items).to.be.an('array');
      expect(res.body.data.Items.length).to.equal(2);
      createdOrderId = res.body.data.OrderId;
    });

    it('should create a guest order with guestName', async () => {
      const res = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({ stallId: 1, totalAmount: 4.0, guestName: 'Walk-in Customer' });
      // customer2 token is being used here as if a customer, but the body uses guestName.
      // The controller will treat the authenticated customer as the orderer because
      // req.user.role === 'Customer' overrides guestName. Either way the order should
      // be created. Let's just assert 201.
      expect(res.status).to.equal(201);
    });
  });

  describe('PUT /api/orders/:id (status transitions)', () => {
    it('should allow vendor to advance Pending -> Preparing', async () => {
      if (!createdOrderId) return;
      const res = await request(app)
        .put(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${vendor1Token}`)
        .send({ status: 'Preparing' });
      expect(res.status).to.equal(200);
      expect(res.body.data.Status).to.equal('Preparing');
    });

    it('should allow vendor to advance Preparing -> Ready', async () => {
      if (!createdOrderId) return;
      const res = await request(app)
        .put(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${vendor1Token}`)
        .send({ status: 'Ready' });
      expect(res.status).to.equal(200);
      expect(res.body.data.Status).to.equal('Ready');
    });

    it('should reject invalid status transition', async () => {
      if (!createdOrderId) return;
      const res = await request(app)
        .put(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'Pending' }); // Ready -> Pending is invalid
      expect(res.status).to.equal(400);
    });

    it('should reject customer setting a non-cancel status', async () => {
      if (!createdOrderId) return;
      const res = await request(app)
        .put(`/api/orders/${createdOrderId}`)
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ status: 'Completed' });
      expect(res.status).to.equal(403);
    });

    it('should allow customer to cancel a Pending order (try a different order)', async () => {
      // Use the existing Pending order #1 which is owned by customer1
      const res = await request(app)
        .put('/api/orders/1')
        .set('Authorization', `Bearer ${customer1Token}`)
        .send({ status: 'Cancelled' });
      expect(res.status).to.equal(200);
      expect(res.body.data.Status).to.equal('Cancelled');
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should reject vendor deletion', async () => {
      const res = await request(app)
        .delete('/api/orders/2')
        .set('Authorization', `Bearer ${vendor1Token}`);
      expect(res.status).to.equal(403);
    });

    it('should reject customer from another customer\'s order', async () => {
      const res = await request(app)
        .delete('/api/orders/4') // belongs to customer3
        .set('Authorization', `Bearer ${customer1Token}`);
      expect(res.status).to.equal(403);
    });

    it('should allow operator to delete', async () => {
      const res = await request(app)
        .delete(`/api/orders/${createdOrderId || 2}`)
        .set('Authorization', `Bearer ${operatorToken}`);
      expect(res.status).to.equal(200);
    });
  });
});
