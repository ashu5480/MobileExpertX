/**
 * End-to-end check of accounts, sessions, listing ownership and admin access.
 * Run against a production build:  node tests/auth.e2e.cjs
 */
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3000';

let failures = 0;
const check = (label, cond, extra = '') => {
  if (!cond) failures += 1;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  [' + extra + ']' : ''}`);
};

/** Minimal cookie jar so each identity keeps its own session. */
function jar() {
  const cookies = new Map();
  return {
    header: () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb(res) {
      for (const c of res.headers.getSetCookie?.() ?? []) {
        const [pair] = c.split(';');
        const idx = pair.indexOf('=');
        if (idx > 0) cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
      }
    },
  };
}

async function call(session, path, options = {}) {
  const headers = { ...(options.headers ?? {}) };
  const cookie = session.header();
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(BASE + path, { ...options, headers, redirect: 'manual' });
  session.absorb(res);
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not json */
  }
  return { status: res.status, json, text, location: res.headers.get('location') };
}

const post = (session, path, body) =>
  call(session, path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const patch = (session, path, body) =>
  call(session, path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

async function main() {
  const stamp = Date.now();
  const email = `buyer${stamp}@example.com`;
  const admin = jar();
  const buyer = jar();
  const stranger = jar();

  // -- Anonymous is locked out -----------------------------------------
  const anonAdmin = await call(jar(), '/admin');
  check('anonymous /admin redirects', anonAdmin.status === 307, `status=${anonAdmin.status}`);
  check('redirect goes to /login',
    (anonAdmin.location ?? '').includes('/login'), anonAdmin.location ?? '');

  const anonApi = await call(jar(), '/api/listings', { method: 'GET' });
  check('anonymous listing API is 401', anonApi.status === 401, `status=${anonApi.status}`);

  // -- Registration ----------------------------------------------------
  const reg = await post(buyer, '/api/auth/register', {
    name: 'Test Buyer',
    email,
    phone: '9876543210',
    password: 'secret123',
  });
  check('register creates a customer', reg.status === 201, `status=${reg.status}`);
  check('role is customer', reg.json?.user?.role === 'customer', reg.json?.user?.role);
  check('no password hash is returned',
    !JSON.stringify(reg.json ?? {}).includes('passwordHash'));

  const escalate = await post(jar(), '/api/auth/register', {
    name: 'Sneaky',
    email: `sneaky${stamp}@example.com`,
    password: 'secret123',
    role: 'admin',
  });
  check('cannot self-assign admin', escalate.json?.user?.role === 'customer',
    escalate.json?.user?.role);

  const weak = await post(jar(), '/api/auth/register', {
    name: 'Weak', email: `weak${stamp}@example.com`, password: 'short',
  });
  check('short password rejected', weak.status === 400, `status=${weak.status}`);

  const dupe = await post(jar(), '/api/auth/register', {
    name: 'Dupe', email, password: 'secret123',
  });
  check('duplicate email rejected', dupe.status === 400, `status=${dupe.status}`);

  // -- Login -----------------------------------------------------------
  const badLogin = await post(jar(), '/api/auth/login', { email, password: 'wrong-one' });
  check('wrong password rejected', badLogin.status === 400, `status=${badLogin.status}`);

  const goodLogin = await post(buyer, '/api/auth/login', { email, password: 'secret123' });
  check('correct password signs in', goodLogin.status === 200, `status=${goodLogin.status}`);

  return { stamp, email, admin, buyer, stranger };
}


async function listingChecks({ buyer, stranger, stamp }) {
  // -- Create 12 items -------------------------------------------------
  const created = [];
  for (let i = 1; i <= 12; i += 1) {
    const res = await post(buyer, '/api/listings', {
      title: `Test item number ${i}`,
      description: `A description for item ${i} that is long enough.`,
      price: 1000 + i,
      category: 'phone',
      condition: 'used',
      photos: [],
    });
    if (i === 1) {
      check('listing is created', res.status === 201, `status=${res.status}`);
      check('listing starts active', res.json?.listing?.status === 'active');
    }
    created.push(res.json?.listing);
  }

  // -- Pagination: 12 items at 10 per page is exactly 2 pages ----------
  const p1 = await call(buyer, '/api/listings?page=1');
  const p2 = await call(buyer, '/api/listings?page=2');
  check('page 1 returns exactly 10', p1.json?.items?.length === 10,
    `got ${p1.json?.items?.length}`);
  check('page 1 reports 12 total', p1.json?.total === 12, `got ${p1.json?.total}`);
  check('page 1 reports 2 total pages', p1.json?.totalPages === 2,
    `got ${p1.json?.totalPages}`);
  check('page 2 returns the remaining 2', p2.json?.items?.length === 2,
    `got ${p2.json?.items?.length}`);
  check('pages do not overlap',
    !p1.json.items.some((a) => p2.json.items.some((b) => b.id === a.id)));

  // -- Ownership isolation ---------------------------------------------
  // The stranger must be a *signed-in* other user: an anonymous caller gets
  // 401 before ownership is even considered, which would not prove scoping.
  const strangerEmail = `stranger${stamp}@example.com`;
  await post(stranger, '/api/auth/register', {
    name: 'Other User',
    email: strangerEmail,
    password: 'secret123',
  });

  const target = created[0];
  const strangerRead = await call(stranger, `/api/listings/${target.id}`);
  check("cannot read another user's listing", strangerRead.status === 404,
    `status=${strangerRead.status}`);

  const strangerPatch = await patch(stranger, `/api/listings/${target.id}`, {
    title: 'Hijacked title here',
  });
  check("cannot edit another user's listing", strangerPatch.status === 404,
    `status=${strangerPatch.status}`);

  const strangerDelete = await call(stranger, `/api/listings/${target.id}`, { method: 'DELETE' });
  check("cannot delete another user's listing", strangerDelete.status === 404,
    `status=${strangerDelete.status}`);

  const strangerList = await call(stranger, '/api/listings');
  check("another user's list is empty", strangerList.json?.total === 0,
    `total=${strangerList.json?.total}`);

  // -- Update ----------------------------------------------------------
  const updated = await patch(buyer, `/api/listings/${target.id}`, {
    title: 'Updated title here',
    price: 7777,
  });
  check('owner can update their listing', updated.status === 200, `status=${updated.status}`);
  check('update applied', updated.json?.listing?.title === 'Updated title here');
  check('price stored in paise', updated.json?.listing?.pricePaise === 777700,
    String(updated.json?.listing?.pricePaise));

  // -- Validation ------------------------------------------------------
  const bad = await post(buyer, '/api/listings', {
    title: 'x', description: 'short', price: 0,
  });
  check('invalid listing rejected', bad.status === 400, `status=${bad.status}`);

  const badPhoto = await post(buyer, '/api/listings', {
    title: 'Photo injection attempt',
    description: 'Trying to point the database at an external URL.',
    price: 500,
    photos: ['https://evil.example.com/x.jpg'],
  });
  check('external photo path rejected', badPhoto.status === 400, `status=${badPhoto.status}`);
}

async function adminChecks({ admin, buyer }) {
  const anonAdminApi = await call(jar(), '/api/admin/orders', { method: 'GET' });
  check('anonymous gets 401 on admin API', anonAdminApi.status === 401,
    `status=${anonAdminApi.status}`);

  // Next.js commits the 200 status before a streamed `redirect()` is thrown,
  // so a redirect out of a server component arrives as 200 plus a location
  // hint in the RSC payload, not a 307. What matters is that no admin
  // content is served and that the response points somewhere safe.
  const page = await call(buyer, '/admin');
  const body = page.text ?? '';
  const leaked = body.includes('MobilExpertX Admin') || body.includes('Dashboard');
  check('customer does not receive admin content', !leaked, `leak=${leaked}`);
  check('customer is redirected to their account',
    page.status === 307 || body.includes('"/account"'),
    `status=${page.status} loc=${page.location ?? ''}`);

  const customerAdminApi = await call(buyer, '/api/admin/orders', { method: 'GET' });
  check('customer gets 403 on admin API', customerAdminApi.status === 403,
    `status=${customerAdminApi.status}`);

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.log('SKIP  admin sign-in (ADMIN_EMAIL / ADMIN_PASSWORD not set)');
    return;
  }

  const login = await post(admin, '/api/auth/login', { email, password });
  check('admin can sign in', login.status === 200, `status=${login.status}`);
  check('admin role returned', login.json?.user?.role === 'admin', login.json?.user?.role);

  const all = await call(admin, '/api/listings?page=1');
  check('admin sees customer listings', (all.json?.total ?? 0) >= 12,
    `total=${all.json?.total}`);

  const selfDemote = await patch(admin, '/api/admin/users', {
    userId: login.json?.user?.id,
    role: 'customer',
  });
  check('admin cannot demote themselves', selfDemote.status === 400,
    `status=${selfDemote.status}`);

  const badStatus = await patch(admin, '/api/admin/sellRequests', {
    id: 'nope',
    status: 'not-a-real-status',
  });
  check('unknown status rejected', badStatus.status === 400, `status=${badStatus.status}`);

  const adminPage = await call(admin, '/admin');
  check('admin dashboard renders', adminPage.status === 200, `status=${adminPage.status}`);
  check('admin dashboard has content',
    (adminPage.text ?? '').includes('MobilExpertX Admin'), '');

  const items = await call(admin, '/admin/items');
  check('admin items page renders', items.status === 200, `status=${items.status}`);

  const users = await call(admin, '/admin/users');
  check('admin users page renders', users.status === 200, `status=${users.status}`);

  const queue = await call(admin, '/admin/sellRequests');
  check('admin queue page renders', queue.status === 200, `status=${queue.status}`);
}

(async () => {
  const ctx = await main();
  await listingChecks(ctx);
  await adminChecks(ctx);

  // -- Logout invalidates the session ----------------------------------
  const before = await call(ctx.buyer, '/api/listings');
  check('session works before logout', before.status === 200, `status=${before.status}`);

  await call(ctx.buyer, '/api/auth/logout', { method: 'POST' });
  const after = await call(ctx.buyer, '/api/listings');
  check('session is dead after logout', after.status === 401, `status=${after.status}`);

  console.log(`\nauth + admin: ${failures} failure(s)`);
  if (failures > 0) process.exitCode = 1;
})();

