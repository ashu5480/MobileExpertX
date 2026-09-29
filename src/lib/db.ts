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
  migrate(d);
  return d;
}

export const db: DatabaseSync = g.__mexDb ?? (g.__mexDb = open());

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
