import 'server-only';
import { MongoClient, Db, Collection } from 'mongodb';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  MongoDB access layer (replaces the former node:sqlite layer)
 * ────────────────────────────────────────────────────────────────────────────
 *  Replaces `src/lib/db.ts`, which opened a SQLite file on the local disk.
 *  That could not work on Vercel: the production filesystem is read-only and
 *  ephemeral, so the database was gone on every cold start and every deploy.
 *
 *  Three things make this serverless-safe:
 *
 *   1. CONNECTION CACHING. A `MongoClient` owns a connection pool, and opening
 *      one per request would exhaust Atlas' connection limit within minutes.
 *      The client promise is parked on `globalThis`, so it survives module
 *      re-evaluation in dev HMR and is shared by every concurrent request
 *      inside a warm function instance.
 *
 *   2. LAZY CONNECT. Nothing dials at import time. `next build` imports route
 *      modules across parallel workers; connecting eagerly is exactly the
 *      stampede this avoids.
 *
 *   3. REAL DATES. Timestamps are stored as BSON `Date`, not ISO strings, so
 *      range queries and sorts use an index instead of a string comparison.
 *      They serialise back to the same ISO string over the wire, so the public
 *      JSON contract is unchanged.
 *
 *  Collections map 1:1 onto the old SQLite tables. There is deliberately NO
 *  `admins` collection (an admin is a `users` document with role 'admin') and
 *  NO `catalogue` collection (the catalogue IS the `products` collection).
 */

const g = globalThis as typeof globalThis & {
  __mexMongo?: Promise<{ client: MongoClient; db: Db }>;
};

function uri(): string {
  const value = process.env.MONGODB_URI?.trim();
  if (!value) {
    throw new Error(
      'MONGODB_URI is not set. Copy .env.example to .env.local and fill it in — ' +
        'the app cannot read or write any data without it.',
    );
  }
  return value;
}

function dbName(): string {
  const value = process.env.MONGODB_DB?.trim();
  if (!value) {
    throw new Error('MONGODB_DB is not set (for example: MONGODB_DB=mobilexpertx).');
  }
  return value;
}

/**
 * Opens (or returns) the shared client.
 *
 * The rejection is cached alongside the promise so a bad URI fails fast and
 * loudly on every call rather than retrying a doomed handshake each time; a
 * later call with a corrected environment gets a fresh attempt because dev
 * restarts the process.
 */
export function connect(): Promise<{ client: MongoClient; db: Db }> {
  if (!g.__mexMongo) {
    const client = new MongoClient(uri(), {
      // Fail fast instead of hanging a serverless invocation until it times
      // out — a dead database should surface as a 500 the caller can log.
      serverSelectionTimeoutMS: 5_000,
      connectTimeoutMS: 10_000,
      maxPoolSize: 10,
    });

    g.__mexMongo = client
      .connect()
      .then(async (connected) => {
        const db = connected.db(dbName());
        await ensureIndexes(db);



        return { client: connected, db };
      })
      .catch((error) => {
        // Drop the cached rejection so the next request can retry.
        g.__mexMongo = undefined;
        throw error;
      });
  }
  return g.__mexMongo;
}

/** The database handle. Await this in every data-access function. */
export async function getDb(): Promise<Db> {
  return (await connect()).db;
}

/* - Document types (previously exported from db.ts) - */

export interface UserDoc {
  _id: string;
  email: string;
  passwordHash: string;
  name: string;
  phone: string | null;
  role: 'admin' | 'customer';
  createdAt: Date;
}

export interface SessionDoc {
  _id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface ProductDoc {
  _id: string;
  kind: 'phone' | 'accessory';
  slug: string;
  name: string;
  brand: string;
  category: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  description: string;
  images: string[];
  active: boolean;
  discountPercent: number;
  featured: boolean;
  sku: string;
  highlights: string[];
  compatibility: string[];
  /** Full object for admin-created items, which have no bundled seed twin. */
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListingDoc {
  _id: string;
  userId: string;
  title: string;
  description: string;
  pricePaise: number;
  category: string;
  condition: string;
  photos: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Queue documents all share a shape: an id, a human-facing reference, a status
 * vocabulary, and the original submitted object kept verbatim under `payload`.
 *
 * `payload` is a real embedded document rather than the JSON string SQLite
 * held, so the admin aggregations can project and filter fields directly.
 */
export interface QueueDoc {
  _id: string;
  reference: string;
  status: string;
  payload: Record<string, unknown>;
  totalPaise?: number;
  quotedPaise?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDoc extends QueueDoc {
  reference: string;
  totalPaise: number;
}
/* ── Collections ──────────────────────────────────────────────────────────── */

export const users = async (): Promise<Collection<UserDoc>> =>
  (await getDb()).collection<UserDoc>('users');
export const sessions = async (): Promise<Collection<SessionDoc>> =>
  (await getDb()).collection<SessionDoc>('sessions');
export const products = async (): Promise<Collection<ProductDoc>> =>
  (await getDb()).collection<ProductDoc>('products');
export const listings = async (): Promise<Collection<ListingDoc>> =>
  (await getDb()).collection<ListingDoc>('listings');
export const orders = async (): Promise<Collection<OrderDoc>> =>
  (await getDb()).collection<OrderDoc>('orders');
export const bookings = async (): Promise<Collection<QueueDoc>> =>
  (await getDb()).collection<QueueDoc>('bookings');
export const sellRequests = async (): Promise<Collection<QueueDoc>> =>
  (await getDb()).collection<QueueDoc>('sellRequests');
export const inquiries = async (): Promise<Collection<QueueDoc>> =>
  (await getDb()).collection<QueueDoc>('inquiries');

/* ── Indexes ──────────────────────────────────────────────────────────────── */

/**
 * Declares every index the application relies on.
 *
 * `createIndexes` is idempotent, so this is safe to run on every cold start;
 * it is awaited once per client instance and then never again. Indexes are
 * created rather than assumed because a unique index is also the ONLY thing
 * enforcing "one account per email" -- without it, two concurrent cold starts
 * could each seed a duplicate admin.
 */
async function ensureIndexes(db: Db): Promise<void> {
  await Promise.all([
    db.collection('users').createIndexes([
      { key: { email: 1 }, name: 'email_unique', unique: true },
      { key: { createdAt: -1 }, name: 'createdAt_desc' },
      { key: { role: 1 }, name: 'role' },
    ]),

    db.collection('sessions').createIndexes([
      { key: { userId: 1 }, name: 'userId' },
      // Lets MongoDB reap expired sessions on its own instead of every read
      // having to notice and delete them.
      { key: { expiresAt: 1 }, name: 'ttl', expireAfterSeconds: 0 },
    ]),

    db.collection('products').createIndexes([
      { key: { slug: 1 }, name: 'slug' },
      { key: { kind: 1 }, name: 'kind' },
      { key: { active: 1 }, name: 'active' },
    ]),

    db.collection('listings').createIndexes([
      { key: { userId: 1, createdAt: -1 }, name: 'userId_createdAt' },
      { key: { status: 1 }, name: 'status' },
    ]),

    ...(['orders', 'bookings', 'sellRequests', 'inquiries'] as const).map((name) =>
      db.collection(name).createIndexes([
        { key: { reference: 1 }, name: 'reference' },
        { key: { createdAt: -1 }, name: 'createdAt_desc' },
        { key: { status: 1 }, name: 'status' },
      ]),
    ),
  ]);
}

/* ── Shared helpers (formerly exported from db.ts) ────────────────────────── */

export const now = (): Date => new Date();

/** Short, sortable, collision-resistant enough for a single-tenant shop. */
export function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** True when a write failed because a unique index already holds the value. */
export function isDuplicateKey(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: number }).code === 11000;
}
