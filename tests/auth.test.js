// tests/auth.test.js — Auth endpoint tests
const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../app');

describe('Auth API', () => {
  let customerToken;
  let vendorToken;
  let neaToken;
  let operatorToken;

  describe('POST /api/auth/login', () => {
    it('should login customer with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@test.com', password: 'Password123' });
      expect(res.status).to.equal(200);
      expect(res.body.success).to.be.true;
      expect(res.body.data).to.have.property('token');
      expect(res.body.data.user.role).to.equal('Customer');
      customerToken = res.body.data.token;
    });

    it('should login vendor with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vendor1@test.com', password: 'Password123' });
      expect(res.status).to.equal(200);
      vendorToken = res.body.data.token;
    });

    it('should login NEA officer with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nea1@test.com', password: 'Password123' });
      expect(res.status).to.equal(200);
      neaToken = res.body.data.token;
    });

    it('should login operator with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'operator1@test.com', password: 'Password123' });
      expect(res.status).to.equal(200);
      operatorToken = res.body.data.token;
    });

    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'Password123' });
      expect(res.status).to.equal(401);
      expect(res.body.success).to.be.false;
    });

    it('should reject wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@test.com', password: 'WrongPassword' });
      expect(res.status).to.equal(401);
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'customer1@test.com' });
      expect(res.status).to.equal(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should reject invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'not-an-email', password: 'Password123', fullName: 'Test', role: 'Customer' });
      expect(res.status).to.equal(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'short', fullName: 'Test', role: 'Customer' });
      expect(res.status).to.equal(400);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@test.com', password: 'Password123', fullName: 'Test', role: 'Admin' });
      expect(res.status).to.equal(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${customerToken}`);
      expect(res.status).to.equal(200);
      expect(res.body.data).to.have.property('Email', 'customer1@test.com');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).to.equal(401);
    });
  });

  describe('PUT /api/auth/password', () => {
    it('should reject incorrect old password', async () => {
      const res = await request(app)
        .put('/api/auth/password')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ oldPassword: 'WrongPassword', newPassword: 'NewPassword123' });
      expect(res.status).to.equal(401);
    });
  });
});
