import test from 'node:test';
import assert from 'node:assert/strict';
import AdminUser from '../models/AdminUser.js';

test('AdminUser role enum contains expected roles', async () => {
  const rolePath = AdminUser.schema.path('role');
  const enumValues = rolePath.options.enum;

  assert.deepEqual(enumValues, [
    'owner',
    'staff',
    'support',
    'admin',
    'superadmin',
    'vendor_manager',
    'booking_manager'
  ]);
});

test('AdminUser default role and active status are set', async () => {
  const admin = new AdminUser({
    name: 'Test Admin',
    email: 'test-admin@example.com',
    password: 'secret123'
  });

  assert.equal(admin.role, 'staff');
  assert.equal(admin.isActive, true);
});
