import 'server-only';
import {
  bookings as bookingsCollection,
  inquiries as inquiriesCollection,
  listings as listingsCollection,
  orders as ordersCollection,
  products as productsCollection,
  sellRequests as sellRequestsCollection,
  users as usersCollection,
  now,
  type QueueDoc,
} from '@/lib/mongo';
import { type QueueName, type QueueRow } from '@/lib/admin-shared';

/**
 * Read models for the admin panel. Server-only: it queries MongoDB.
 *
 * Counts and the revenue total run as real database operations rather than in
 * JavaScript, so the dashboard cost does not grow with the size of the
 * collection: the old `SELECT COUNT(*)` becomes `countDocuments`, and
 * `SELECT SUM(...)` becomes a `$group` aggregation.
 */

export { readPayload, type QueueName, type QueueRow } from '@/lib/admin-shared';

export async function adminStats() {
  const [customers, listingsTotal, activeListings, productsTotal, ordersTotal, bookingsTotal, sellTotal, inquiriesTotal, revenue] =
    await Promise.all([
      (await usersCollection()).countDocuments({ role: 'customer' }),
      (await listingsCollection()).countDocuments({}),
      (await listingsCollection()).countDocuments({ status: 'active' }),
      (await productsCollection()).countDocuments({}),
      (await ordersCollection()).countDocuments({}),
      (await bookingsCollection()).countDocuments({}),
      (await sellRequestsCollection()).countDocuments({}),
      (await inquiriesCollection()).countDocuments({}),
      // `COALESCE(SUM(totalPaise), 0)` -> $sum over matching documents. An
      // empty result set yields no rows, hence the ?? 0.
      (await ordersCollection())
        .aggregate<{ revenue: number }>([
          { $match: { status: { $ne: 'cancelled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalPaise' } } },
        ])
        .next(),
    ]);

  return {
    customers,
    listings: listingsTotal,
    activeListings,
    products: productsTotal,
    orders: ordersTotal,
    bookings: bookingsTotal,
    sellRequests: sellTotal,
    inquiries: inquiriesTotal,
    revenuePaise: revenue?.revenue ?? 0,
  };
}

/**
 * Which collection and which money field each queue reads.
 *
 * A fixed map, never a caller-supplied string: the old code interpolated this
 * into SQL, so allowing an arbitrary name here would be just as injectable.
 */
const QUEUES = {
  orders: { collection: ordersCollection, money: 'totalPaise' },
  bookings: { collection: bookingsCollection, money: null },
  sellRequests: { collection: sellRequestsCollection, money: 'quotedPaise' },
  inquiries: { collection: inquiriesCollection, money: null },
} as const;

/** Paginated queue rows for the admin tables. */
export async function listQueue(
  queue: QueueName,
  page = 1,
  pageSize = 20,
): Promise<{ items: QueueRow[]; total: number; page: number; totalPages: number }> {
  const { collection, money } = QUEUES[queue];
  const current = Math.max(1, page);
  const db = await collection();

  const total = await db.countDocuments({});

  const items = await db
    .find({})
    .sort({ createdAt: -1 })
    .skip((current - 1) * pageSize)
    .limit(pageSize)
    .toArray();

  return {
    items: items.map((d) => toQueueRow(d, money)),
    total,
    page: current,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

function toQueueRow(d: QueueDoc, money: 'totalPaise' | 'quotedPaise' | null): QueueRow {
  return {
    id: d._id,
    reference: d.reference,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
    // The admin table parses this to show the customer's name; keeping it a
    // real embedded document means MongoDB can index and project into it.
    payload: JSON.stringify(d.payload ?? {}),
    ...(money === 'totalPaise' ? { totalPaise: d.totalPaise ?? 0 } : {}),
    ...(money === 'quotedPaise' ? { quotedPaise: d.quotedPaise ?? 0 } : {}),
  };
}

export async function setQueueStatus(
  queue: QueueName,
  id: string,
  status: string,
): Promise<boolean> {
  const { collection } = QUEUES[queue];
  const result = await (await collection()).updateOne(
    { _id: id },
    { $set: { status, updatedAt: now() } },
  );
  return result.matchedCount > 0;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
  listingCount: number;
}

/**
 * Every account with how many items each has listed.
 *
 * The old SQL used a correlated subquery per row; `$lookup` with a count
 * pipeline does the same work in one pass on the server. The `$limit` is
 * applied BEFORE the lookup so it bounds the joined work, not just the scan.
 */
export async function listUsersWithCounts(): Promise<UserRow[]> {
  const rows = await (await usersCollection())
    .aggregate<{
      _id: string;
      email: string;
      name: string;
      phone: string | null;
      role: string;
      createdAt: Date;
      listingCount: number;
    }>([
      { $sort: { createdAt: -1 } },
      { $limit: 200 },
      {
        $lookup: {
          from: 'listings',
          let: { userId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$userId', '$$userId'] } } },
            { $count: 'n' },
          ],
          as: 'listingCounts',
        },
      },
      {
        $project: {
          _id: 1,
          email: 1,
          name: 1,
          phone: 1,
          role: 1,
          createdAt: 1,
          // An owner with no listings has no counts document, so default to 0
          // exactly as SQL's correlated COUNT(*) did.
          listingCount: { $ifNull: [{ $arrayElemAt: ['$listingCounts.n', 0] }, 0] },
        },
      },
    ])
    .toArray();

  return rows.map((r) => ({
    id: r._id,
    email: r.email,
    name: r.name,
    phone: r.phone,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
    listingCount: r.listingCount,
  }));
}

