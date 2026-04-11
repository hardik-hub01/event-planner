import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/auth.js';

function createResponse() {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    }
  };
}

test('authMiddleware accepts a valid JWT and calls next()', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const token = jwt.sign({ userId: '123', email: 'admin@example.com' }, process.env.JWT_SECRET);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = createResponse();

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  authMiddleware(req, res, next);

  assert.equal(nextCalled, true);
  assert.equal(req.user.email, 'admin@example.com');
  assert.equal(res.statusCode, 200);
});

test('authMiddleware rejects missing JWT', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const req = { headers: {} };
  const res = createResponse();

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
  };

  authMiddleware(req, res, next);

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { error: 'No authorization token provided' });
});
