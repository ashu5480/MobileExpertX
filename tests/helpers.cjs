/**
 * Shared helpers for the API integration tests.
 * The suite runs against a production build on http://localhost:3000.
 */
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: await res.json().catch(() => null) };
}

async function get(path) {
  const res = await fetch(BASE + path);
  return { status: res.status, json: await res.json().catch(() => null) };
}

let failures = 0;
function assert(label, cond, extra = '') {
  if (!cond) failures += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  [' + extra + ']' : ''}`);
}

const CUSTOMER = {
  fullName: 'Test Customer',
  phone: '9876543210',
  email: 'test@example.com',
  addressLine: 'Flat 402, Shanti Residency',
  area: 'Satellite',
  city: 'Ahmedabad',
  state: 'Gujarat',
  pincode: '380059',
  deliveryMethod: 'standard',
};

const QUOTE_BASE = {
  brand: 'Apple',
  model: 'iPhone 14',
  storage: '256 GB',
  condition: 'good',
  screen: 'perfect',
  battery: 'healthy',
  body: 'pristine',
  accessories: ['Original box'],
  hasOriginalBox: true,
  purchaseAge: '12-24',
};

module.exports = { BASE, post, get, assert, CUSTOMER, QUOTE_BASE, counts: () => failures };
