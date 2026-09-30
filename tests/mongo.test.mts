/**
 * ────────────────────────────────────────────────────────────────────────────
 *  MongoDB data-layer integration test
 * ────────────────────────────────────────────────────────────────────────────
 *  Runs the REAL data layer against a real (in-memory) MongoDB, with no HTTP
 *  server and no mocks. This is what proves the SQLite -> MongoDB migration
 *  actually works: the SQL aggregates became pipelines, the in-memory Maps are
 *  no longer the source of truth, and a fresh module registry can still read
 *  back everything a previous instance wrote.
 *
 *  Run with:  node --experimental-strip-types tests/mongo.test.mts
 */
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';

let pass = 0;
let fail = 0;

function check(label: string, condition: boolean, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  ok   ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

const mongod = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongod.getUri('mexmigrationtest');
process.env.MONGODB_DB = 'mexmigrationtest';
process.env.ADMIN_EMAIL = 'owner@test.local';
process.env.ADMIN_PASSWORD = 'a-long-enough-test-password';
process.env.ADMIN_NAME = 'Test Owner';

/* ── auth + sessions ──────────────────────────────────────────────────────── */
console.log('\nauth + sessions');
const { ensureAdminUser, createUser, findUserByEmail, verifyPassword, createSession, userForToken, destroySession, setUserRole, listUsers } =
  await import('../src/lib/auth.ts');

const seeded = await ensureAdminUser();
check('admin is seeded from environment variables', seeded.created === true);

const again = await ensureAdminUser();
check('seeding twice does not create a second admin', again.created === false);

const admin = await findUserByEmail('OWNER@test.local');
check('email lookup is case-insensitive', admin !== null);
check('password is not stored in plaintext', admin!.passwordHash.includes(':'));
check('stored hash verifies', verifyPassword('a-long-enough-test-password', admin!.passwordHash));
check('wrong password is rejected', !verifyPassword('wrong-password', admin!.passwordHash));

const dupe = await createUser({ email: 'owner@test.local', password: 'another-password', name: 'Imposter' });
check('duplicate email is refused', dupe === null);

const customer = await createUser({
  email: 'Customer@Test.local',
  password: 'customer-password',
  name: 'Casey Customer',
  phone: '9716216480',
});
check('customer is created', customer !== null);
check('createdAt serialises as an ISO string', !Number.isNaN(Date.parse(customer!.createdAt)));

const token = await createSession(customer!.id);
const sessionUser = await userForToken(token);
check('session resolves to the right user', sessionUser?.email === 'customer@test.local');
check('an unknown token resolves to nobody', (await userForToken('not-a-real-token')) === null);
check('a missing token resolves to nobody', (await userForToken(undefined)) === null);

await destroySession(token);
check('logout deletes the session document', (await userForToken(token)) === null);

await setUserRole(customer!.id, 'admin');
check('role change persists', (await findUserByEmail('customer@test.local'))?.role === 'admin');
await setUserRole(customer!.id, 'customer');
check('all users are listed', (await listUsers()).length === 2);


/* ── catalogue overlay ────────────────────────────────────────────────────── */
console.log('\ncatalogue overlay');
const { ensureCatalogueSeeded, listForAdmin, createCatalogueItem, getCatalogueRow, updateCatalogueItem, deleteCatalogueItem, overlayProducts, overlayAccessories } =
  await import('../src/lib/catalogue.ts');

await ensureCatalogueSeeded();
const seededRows = await listForAdmin();
check('bundled catalogue is seeded into MongoDB', seededRows.length > 0, `got ${seededRows.length}`);
check(
  'every seeded row has a native string[] images field',
  seededRows.every((r) => Array.isArray(r.images) && r.images.every((i) => typeof i === 'string')),
);
check('seeded rows default to active', seededRows.every((r) => r.active === 1));

const created = await createCatalogueItem({
  kind: 'accessory',
  name: 'Test Desk Lamp',
  pricePaise: 249900,
  mrpPaise: 399900,
  stock: 7,
  description: 'A lamp created by the integration test.',
  images: ['https://store.public.blob.vercel-storage.com/uploads/test-lamp.png'],
  active: true,
});
check('an admin item can be created', created.name === 'Test Desk Lamp');

const fetched = await getCatalogueRow(created.id);
check('the created item reads back', fetched?.id === created.id);
check('the created item keeps its image array', Array.isArray(fetched?.images) && fetched!.images.length === 1);

const updated = await updateCatalogueItem(created.id, { pricePaise: 199900 });
check('an update persists', updated?.pricePaise === 199900);

const accessories = await overlayAccessories();
check('the overlay includes the new accessory', accessories.some((a) => a.id === created.id));
check('the overlay still returns the bundled phones', (await overlayProducts()).length > 0);

check('deleting the item works', (await deleteCatalogueItem(created.id)) === true);
check('a deleted item is gone', (await getCatalogueRow(created.id)) === null);

/* ── listings + the users JOIN ────────────────────────────────────────────── */
console.log('\nlistings');
const { createListing, listForUser, getOwned, listAll, updateListing, setListingStatus, deleteListing } =
  await import('../src/lib/listings.ts');

const l1 = await createListing(customer!.id, {
  title: 'Red OnePlus 12',
  description: 'Lightly used, box and charger included.',
  pricePaise: 4500000,
  category: 'phone',
  condition: 'used',
  photos: ['https://store.public.blob.vercel-storage.com/uploads/oneplus.png'],
});
check('a listing is created', l1.title === 'Red OnePlus 12');
check('photos round-trip as an array', Array.isArray(l1.photos) && l1.photos.length === 1);

const mine = await listForUser(customer!.id, 1, 10);
check('the owner sees their listing', mine.total === 1 && mine.items[0].id === l1.id);
check('pagination maths is right for one row', mine.totalPages === 1);
check('another user cannot read it', (await getOwned(admin!.id, l1.id)) === null);
check('a missing id returns null', (await getOwned(customer!.id, 'nope')) === null);

const all = await listAll(1, 20);
check('the admin list joins the owner email', all.items[0].ownerEmail === 'customer@test.local');
check('the admin list joins the owner name', all.items[0].ownerName === 'Casey Customer');


/* ── orders, bookings, enquiries ──────────────────────────────────────────── */
console.log('\norders, bookings, enquiries');
const repo = await import('../src/services/repository.ts');
const { adminStats, listQueue, setQueueStatus, listUsersWithCounts } = await import('../src/lib/adminService.ts');

const order = await repo.createOrder({
  fullName: 'Casey Customer',
  phone: '9716216480',
  email: 'customer@test.local',
  addressLine: '12 MG Road',
  area: 'Indore',
  city: 'Indore',
  state: 'MP',
  pincode: '452001',
  deliveryMethod: 'standard',
  lines: [{ productId: 'p-iphone-15-pro', variantKey: 'default|128 GB|8 GB', quantity: 1 }],
});
check('an order is created', Boolean(order.orderNumber));
const grand = order.totals.grandTotalPaise;
check('the server computed a total', grand > 0);

const byId = await repo.getOrderById(order.id);
check('the order reads back by id', byId?.orderNumber === order.orderNumber);
check('the order reads back by number', (await repo.getOrderByNumber(order.orderNumber))?.id === order.id);

await repo.updateOrder(order.id, { status: 'paid' });
const paid = await repo.getOrderById(order.id);
check('an order can be marked paid', paid?.status === 'paid');
// Only `status` was patched, so `paymentStatus` must still be the value the
// order was created with -- this proves the patch is a merge, not a replace.
check('an unrelated field is not clobbered by the patch', paid?.paymentStatus === 'created', `got ${paid?.paymentStatus}`);


const booking = await repo.createRepairBooking({
  name: 'Casey Customer',
  phone: '9716216480',
  brand: 'OnePlus',
  model: '12',
  problem: 'Screen cracked',
  preferredDate: '2026-10-01',
  preferredTime: '10:00',
  dropoff: 'walk-in',
});
check('a booking is created', Boolean(booking.reference));

const sell = await repo.createSellPhoneRequest({
  brand: 'OnePlus', model: '12', storage: '256 GB', condition: 'Good',
  screen: 'Cracked', battery: 'Good', body: 'Scratches', accessories: ['Box'],
  hasOriginalBox: true, purchaseAge: '1 year', customerName: 'Casey Customer',
  customerPhone: '9716216480', customerEmail: 'customer@test.local',
  address: '12 MG Road', pickupDate: '2026-10-02', pickupTime: '11:00', imageCount: 2,
});
check('a trade-in request is created', Boolean(sell.reference));
check('the valuation is derived server-side', sell.estimatedValuePaise > 0);

const inquiry = await repo.createContactInquiry({
  name: 'Casey Customer', phone: '9716216480', email: 'customer@test.local',
  subject: 'Question', message: 'Do you deliver to Indore?',
});
check('an enquiry is created', Boolean(inquiry.id));

/* ── admin aggregation (SQL -> aggregation pipeline) ──────────────────────── */
console.log('\nadmin aggregation');
const stats = await adminStats();
check('customer count is right', stats.customers === 1, `got ${stats.customers}`);
check('order count is right', stats.orders === 1);
check('booking count is right', stats.bookings === 1);
check('trade-in count is right', stats.sellRequests === 1);
check('enquiry count is right', stats.inquiries === 1);
check('revenue sums the paid order', stats.revenuePaise === grand, `got ${stats.revenuePaise}`);
check('catalogue product count is right', stats.products > 0);

await setQueueStatus('orders', order.id, 'shipped');
const ordersQueue = await listQueue('orders', 1, 20);
check('the orders queue lists the order', ordersQueue.items[0].reference === order.orderNumber);
check('the status change is visible in the queue', ordersQueue.items[0].status === 'shipped');
check(
  'the queue payload is preserved for the UI',
  JSON.parse(ordersQueue.items[0].payload).customer?.fullName === 'Casey Customer',
  JSON.parse(ordersQueue.items[0].payload).customer?.fullName,
);
check('the trade-in queue shows the quote', (await listQueue('sellRequests', 1, 20)).items[0].quotedPaise === sell.estimatedValuePaise);
check('the enquiry queue has no money column', (await listQueue('inquiries', 1, 20)).items[0].quotedPaise === undefined);

const usersWithCounts = await listUsersWithCounts();
const casey = usersWithCounts.find((u) => u.email === 'customer@test.local');
// The listing created above still exists at this point (it is deleted further
// down), so the join must report exactly one.
check('the user/listing join counts the listing', casey?.listingCount === 1, `got ${casey?.listingCount}`);
check('the join still returns the admin', usersWithCounts.some((u) => u.role === 'admin'));


/* ── authorisation boundary ───────────────────────────────────────────────── */
console.log('\nauthorisation');
const { isAdmin } = await import('../src/lib/guards.ts');
check('isAdmin accepts an admin', isAdmin({ id: 'a', email: 'a@t.co', name: 'A', phone: null, role: 'admin', createdAt: '' }));
check('isAdmin rejects a customer', !isAdmin({ id: 'c', email: 'c@t.co', name: 'C', phone: null, role: 'customer', createdAt: '' }));
check('isAdmin rejects null', !isAdmin(null));

console.log(`\n${'='.repeat(56)}\npassed: ${pass}   failed: ${fail}\n${'='.repeat(56)}`);

await mongod.stop();
process.exit(fail === 0 ? 0 : 1);

const renamed = await updateListing(customer!.id, l1.id, { title: 'Blue OnePlus 12' });
check('an owner can update their listing', renamed?.title === 'Blue OnePlus 12');
check('status can be set by an admin', (await setListingStatus(l1.id, 'sold')) === true);
check('a foreign id is not deleted', (await deleteListing(admin!.id, l1.id)) === false);
check('the owner can delete it', (await deleteListing(customer!.id, l1.id)) === true);
