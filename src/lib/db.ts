import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * SQLite persistence, using Node's built-in `node:sqlite`.
 *
 * No ORM, no driver, no install step -- Node 22+ ships the driver itself.
 * Every admin/customer write lands here, so records survive a redeploy.
 */

const DATA_DIR = process.env.MEX_DATA_DIR ?? join(process.cwd(), '.data');
mkdirSync(DATA_DIR, { recursive: true });

const g = globalThis as typeof globalThis & { __mexDb?: DatabaseSync };

function open(): DatabaseSync {
  const d = new DatabaseSync(join(DATA_DIR, 'mobilexpertx.db'));
  d.exec('PRAGMA journal_mode = WAL');
  d.exec('PRAGMA foreign_keys = ON');
  // Wait instead of failing when another process holds the write lock, rather
  // than the default immediate "database is locked" error.
  d.exec('PRAGMA busy_timeout = 5000');
  migrate(d);
  return d;
}

/**
 * Lazily-opened connection.
 *
 * Opening on first use rather than at import time matters during
 * `next build`: page-data collection imports every route module across
 * parallel worker processes, and eagerly opening the file from each of them
 * caused lock contention. Nothing touches the disk until a query runs.
 *
 * The Proxy keeps every existing `db.prepare(...)` call site unchanged.
 */
export const db: DatabaseSync = new Proxy({} as DatabaseSync, {
  get(_target, prop, receiver) {
    const instance = (g.__mexDb ??= open());
    const value = Reflect.get(instance as object, prop, receiver);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/** Adds a column only when it is missing, so re-running migrate() is safe. */
function addColumn(d: DatabaseSync, table: string, column: string, definition: string) {
  const existing = d.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (existing.some((c) => c.name === column)) return;
  try {
    d.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (error) {
    // `next build` runs page-data collection in parallel workers, so two of
    // them can add the same column at once. The loser only needs to shrug.
    const message = error instanceof Error ? error.message : String(error);
    if (!/duplicate column name/i.test(message)) throw error;
  }
}

function migrate(d: DatabaseSync) {
  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expiresAt INTEGER NOT NULL,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);

    -- Customer-created listings. "photos" is a JSON array of public paths.
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      pricePaise INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT 'phone',
      condition TEXT NOT NULL DEFAULT 'used',
      photos TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'active',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(userId);

    -- Admin-editable catalogue overlay. Rows override the bundled seed data.
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      pricePaise INTEGER NOT NULL,
      mrpPaise INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      images TEXT NOT NULL DEFAULT '[]',
      active INTEGER NOT NULL DEFAULT 1,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      orderNumber TEXT NOT NULL UNIQUE,
      userId TEXT,
      payload TEXT NOT NULL,
      totalPaise INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      userId TEXT,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sell_requests (
      id TEXT PRIMARY KEY,
      reference TEXT NOT NULL UNIQUE,
      userId TEXT,
      payload TEXT NOT NULL,
      quotedPaise INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inquiries (
      id TEXT PRIMARY KEY,
      userId TEXT,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Columns added after the first release. SQLite has no "ADD COLUMN IF NOT
  // EXISTS", so each is checked against the live table first -- this runs on
  // every open and is a no-op once the column exists.
  addColumn(d, 'products', 'kind', "TEXT NOT NULL DEFAULT 'phone'");
  addColumn(d, 'products', 'category', "TEXT NOT NULL DEFAULT ''");
  // Percent off the MRP, kept explicit so a 0 discount is distinguishable
  // from "never set" and the storefront badge does not re-derive it.
  addColumn(d, 'products', 'discountPercent', 'INTEGER NOT NULL DEFAULT 0');
  addColumn(d, 'products', 'featured', 'INTEGER NOT NULL DEFAULT 0');
  addColumn(d, 'products', 'sku', "TEXT NOT NULL DEFAULT ''");
  addColumn(d, 'products', 'highlights', "TEXT NOT NULL DEFAULT '[]'");
  addColumn(d, 'products', 'compatibility', "TEXT NOT NULL DEFAULT '[]'");
  // Full object for admin-created items, which have no bundled counterpart
  // to merge into.
  addColumn(d, 'products', 'payload', "TEXT NOT NULL DEFAULT ''");
}

/* Row helpers. node:sqlite returns null-prototype objects; normalise them. */

export function row<T>(r: unknown): T {
  return { ...(r as object) } as T;
}

export function rows<T>(r: unknown[]): T[] {
  return r.map((x) => ({ ...(x as object) }) as T);
}

export const now = () => new Date().toISOString();

/** Short, sortable, collision-resistant enough for a single-tenant shop. */
export function id(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
