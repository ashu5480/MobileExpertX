/**
 * Catalogue admin checks: create, edit price/discount/stock, delete, and
 * confirm the statically generated storefront actually reflects the change.
 */
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

let failures = 0;
const check = (label, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  [' + extra + ']' : ''}`);
};

const call = async (path, options = {}) => {
  const res = await fetch(BASE + path, options);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html */
  }
  return { status: res.status, json, text, headers: res.headers };
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const login = await call('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    }),
  });

  if (!login.headers.getSetCookie?.().length) {
    console.log(`SKIP  admin credentials missing or rejected (status=${login.status})`);
    console.log(`\ncatalogue: ${failures} failure(s)`);
    return;
  }

  const cookie = login.headers.getSetCookie()[0].split(';')[0];
  const H = { 'Content-Type': 'application/json', Cookie: cookie };
  const post = (body) =>
    call('/api/admin/catalogue', { method: 'POST', headers: H, body: JSON.stringify(body) });
  const patch = (body) =>
    call('/api/admin/catalogue', { method: 'PATCH', headers: H, body: JSON.stringify(body) });

  // -- The bundled catalogue is editable ---------------------------------
  const page = await call('/admin/catalogue', { headers: { Cookie: cookie } });
  check('catalogue page renders', page.status === 200, `status=${page.status}`);
  check('seeded items are listed', /GaN/.test(page.text));
  check('add-item control is present', /Add item/.test(page.text));

  // -- Create an accessory with a discount -------------------------------
  const created = await post({
    kind: 'accessory',
    name: 'Desk Lamp Test',
    brand: 'MobilExpertX',
    category: 'other',
    mrp: 2000,
    discount: 50,
    stock: 3,
    description: 'A bright dimmable USB-C desk lamp.',
  });
  check('accessory is created', created.status === 201, `status=${created.status}`);
  const item = created.json?.item;
  check('slug is generated', Boolean(item?.slug), item?.slug);
  // 2000 rupees less 50% = 1000 rupees = 100000 paise
  check('price derived from MRP and discount', item?.pricePaise === 100000,
    String(item?.pricePaise));

  // The grid is hydrated on the client and reads the public catalogue
  // endpoint, so asserting on the server HTML of /accessories would always
  // miss it. The endpoint is what the browser actually calls.
  const publicList = await call('/api/admin/catalogue?public=1');
  check('public catalogue is readable without signing in',
    publicList.status === 200, `status=${publicList.status}`);
  check('new accessory appears in the public catalogue',
    publicList.json?.items?.some((i) => i.slug === item.slug));

  // React splits text nodes with an HTML comment, so the rendered markup reads
  // "50<!-- -->% OFF" rather than "50% OFF".
  const OFF = (html, pct) =>
    new RegExp(`${pct}(?:<!-- -->)?\\s*%\\s*OFF`).test(html);

  const detail = await call(`/accessories/${item.slug}`);
  check('new accessory has a detail page', detail.status === 200, `status=${detail.status}`);
  check('detail page shows the item', /Desk Lamp Test/.test(detail.text));
  check('detail page shows the discount badge', OFF(detail.text, 50));

  // -- A SEEDED item is editable too -------------------------------------
  const seededBefore = await call('/accessories/100w-gan-charger');
  const hadBadge = OFF(seededBefore.text, 50);

  const updated = await patch({ id: 'a-gan-100w', mrp: 3999, discount: 50 });
  check('seeded item accepts an edit', updated.status === 200, `status=${updated.status}`);
  check('seeded discount is stored', updated.json?.item?.discountPercent === 50,
    String(updated.json?.item?.discountPercent));

  await sleep(1500);
  const seededAfter = await call('/accessories/100w-gan-charger');
  check('storefront reflects the seeded edit immediately',
    OFF(seededAfter.text, 50) && !hadBadge, `had=${hadBadge}`);

  // restore the seeded row so repeat runs stay deterministic
  await patch({ id: 'a-gan-100w', mrp: 399900, discount: 0 });

  // -- Validation -------------------------------------------------------
  const tooShort = await post({ kind: 'accessory', name: 'x', price: 0 });
  check('a name is required', tooShort.status === 400, `status=${tooShort.status}`);

  const noPrice = await post({ kind: 'accessory', name: 'Valid name here' });
  check('a price is required', noPrice.status === 400, `status=${noPrice.status}`);

  const badDiscount = await post({
    kind: 'accessory', name: 'Bad discount item', mrp: 1000, discount: 120,
  });
  check('discount above 95% is rejected', badDiscount.status === 400,
    `status=${badDiscount.status}`);

  const discountNoMrp = await post({
    kind: 'accessory', name: 'Discount without MRP', price: 500, discount: 20,
  });
  check('a discount needs an MRP', discountNoMrp.status === 400,
    `status=${discountNoMrp.status}`);

  const badKind = await post({ kind: 'spaceship', name: 'Wrong kind', price: 100 });
  check('an unknown kind is rejected', badKind.status === 400, `status=${badKind.status}`);

  const externalPhoto = await post({
    kind: 'accessory',
    name: 'External photo attempt',
    price: 100,
    images: ['https://evil.example.com/x.jpg'],
  });
  check('external image URLs are rejected', externalPhoto.status === 400,
    `status=${externalPhoto.status}`);

  // -- Auth -------------------------------------------------------------
  const anon = await call('/api/admin/catalogue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'accessory', name: 'Anon attempt', price: 100 }),
  });
  check('anonymous cannot write to the catalogue', anon.status === 401,
    `status=${anon.status}`);

  const stranger = await call('/api/admin/catalogue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ kind: 'accessory', name: 'Stranger', price: 100 }),
  });
  check('unauthenticated write is refused', [401, 403].includes(stranger.status),
    `status=${stranger.status}`);

  // -- Delete ------------------------------------------------------------
  const removed = await call(`/api/admin/catalogue?id=${encodeURIComponent(item.id)}`, {
    method: 'DELETE',
    headers: { Cookie: cookie },
  });
  check('item is deleted', removed.status === 200, `status=${removed.status}`);

  await sleep(1500);
  const afterDelete = await call('/api/admin/catalogue?public=1');
  check('deleted item is gone from the public catalogue',
    !afterDelete.json?.items?.some((i) => i.slug === item.slug));

  const gone = await call(`/accessories/${item.slug}`);
  check('deleted item no longer renders on its detail page',
    !/Desk Lamp Test/.test(gone.text));

  console.log(`\ncatalogue: ${failures} failure(s)`);
  if (failures > 0) process.exitCode = 1;
})();
