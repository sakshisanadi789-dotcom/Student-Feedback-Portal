import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { env } from '../src/config/env.js';

test('protected routes reject requests without a bearer token', async () => {
  const response = await request(app).get('/api/students');
  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'UNAUTHENTICATED');
});

test('login validates required credentials before database access', async () => {
  const response = await request(app).post('/api/auth/login').send({ email: 'admin@northstar.edu' });
  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'VALIDATION_ERROR');
});

test('malformed bearer tokens are rejected consistently', async () => {
  const response = await request(app).get('/api/auth/me').set('Authorization', 'Bearer invalid-token');
  assert.equal(response.status, 401);
  assert.equal(response.body.error, 'INVALID_TOKEN');
});

test('staff cannot read user administration records', async () => {
  const token = jwt.sign({ sub: 12, role: 'staff' }, env.JWT_SECRET);
  const response = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
  assert.equal(response.status, 403);
  assert.equal(response.body.error, 'FORBIDDEN');
});