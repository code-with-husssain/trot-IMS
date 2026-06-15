// End-to-end smoke test against an ephemeral in-memory MongoDB.
// Run: node scripts/smoke-test.js
const { MongoMemoryServer } = require('mongodb-memory-server');
const bcrypt = require('bcryptjs');

async function main() {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = 'test_secret';
  process.env.CLIENT_ORIGIN = 'http://localhost:5173';
  process.env.ADMIN_EMAIL = 'admin@trottk.com';
  process.env.ADMIN_PASSWORD = 'Secret123!';
  process.env.SEED_SECRET = 'seed_secret';

  const connectDB = require('../config/db');
  const app = require('../app');
  const User = require('../models/User');

  await connectDB();

  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}/api`;
  const assert = (cond, msg) => {
    if (!cond) throw new Error('ASSERTION FAILED: ' + msg);
    console.log('  ✓ ' + msg);
  };
  const req = async (method, path, body, token) => {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    return { status: res.status, json };
  };

  try {
    console.log('SEED');
    let r = await req('POST', '/auth/seed');
    assert(r.status === 201, 'seeds admin from env when none exists');
    r = await req('POST', '/auth/seed');
    assert(r.status === 409, 'refuses re-seed without secret once admin exists');
    r = await req('POST', '/auth/seed', { secret: 'seed_secret' });
    assert(r.status === 200, 'allows password reset with valid SEED_SECRET');

    console.log('AUTH');
    r = await req('POST', '/auth/login', { email: 'admin@trottk.com', password: 'wrong' });
    assert(r.status === 401, 'rejects bad password');
    r = await req('POST', '/auth/login', { email: 'admin@trottk.com', password: 'Secret123!' });
    assert(r.status === 200 && r.json.token, 'logs in with correct password');
    const token = r.json.token;

    r = await req('GET', '/clients', null, null);
    assert(r.status === 401, 'protects routes without token');

    console.log('CLIENTS');
    r = await req('POST', '/clients', {
      name: 'Yazeed Altaweel',
      email: 'yazoid1421@gmail.com',
    }, token);
    assert(r.status === 201, 'creates a client');
    const clientId = r.json.client._id;

    r = await req('GET', '/clients', null, token);
    assert(r.json.clients.length === 1, 'lists clients with stats');
    assert(r.json.clients[0].invoiceCount === 0, 'client starts with 0 invoices');

    console.log('INVOICES');
    r = await req('POST', '/invoices', {
      client: clientId,
      issueDate: '2026-01-17',
      paymentTermsDays: 15,
      lineItems: [{ service: 'Talent as a Service (1-16 Jan)', totalHours: 107, ratePerHour: 9.4 }],
    }, token);
    assert(r.status === 201, 'creates an invoice');
    const inv = r.json.invoice;
    assert(inv.invoiceNumber === '00001', `invoice number padded (${inv.invoiceNumber})`);
    assert(inv.total === 1005.8, `total computed server-side = 1005.8 (got ${inv.total})`);
    assert(inv.status === 'pending', 'invoice defaults to pending');
    const invId = inv._id;

    // Second invoice → number increments. Dated in 2025 to test the year filter.
    r = await req('POST', '/invoices', {
      client: clientId,
      issueDate: '2025-03-10',
      lineItems: [{ service: 'Consulting', totalHours: 10, ratePerHour: 50 }],
    }, token);
    assert(r.json.invoice.invoiceNumber === '00002', 'invoice number auto-increments');

    console.log('STATUS WORKFLOW');
    r = await req('PATCH', `/invoices/${invId}/status`, { status: 'approved' }, token);
    assert(r.json.invoice.status === 'approved', 'changes status to approved');
    r = await req('PATCH', `/invoices/${invId}/status`, { status: 'paid' }, token);
    assert(r.json.invoice.status === 'paid', 'changes status to paid');
    assert(r.json.invoice.statusHistory.length === 3, 'status history tracked (pending+approved+paid)');
    r = await req('PATCH', `/invoices/${invId}/status`, { status: 'bogus' }, token);
    assert(r.status === 400, 'rejects invalid status');

    console.log('CLIENT DETAIL');
    r = await req('GET', `/clients/${clientId}`, null, token);
    assert(r.json.invoices.length === 2, 'client detail returns associated invoices');

    console.log('DASHBOARD');
    r = await req('GET', '/dashboard?year=2026', null, token);
    assert(r.json.summary.invoiceCount === 1, 'year filter narrows to 2026 invoice');
    assert(r.json.summary.paid === 1005.8, 'paid total reflects paid invoice');
    r = await req('GET', '/dashboard', null, token);
    assert(r.json.summary.invoiceCount === 2, 'unfiltered dashboard counts all invoices');
    assert(r.json.summary.outstanding === 500, 'outstanding = unpaid invoice total (500)');
    assert(Array.isArray(r.json.monthlyRevenue) && r.json.monthlyRevenue.length === 12, 'monthly series has 12 months');
    assert(r.json.topClients.length === 1, 'top clients populated');

    console.log('\nALL SMOKE TESTS PASSED ✅');
  } finally {
    server.close();
    const mongoose = require('mongoose');
    await mongoose.connection.close();
    await mongod.stop();
  }
}

main().catch((err) => {
  console.error('\nSMOKE TEST FAILED ❌\n', err);
  process.exit(1);
});
