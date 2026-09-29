import 'server-only';
import { db, row, rows } from '@/lib/db';

/**
 * Read models for the admin panel.
 *
 * Aggregates run in SQL rather than in JavaScript so the dashboard cost does
 * not grow with the size of the table.
 */

export interface Count {
  n: number;
}

function count(sql: string, ...params: unknown[]): number {
  return (db.prepare(sql).get(...params) as Count).n;
}

export function adminStats() {
  return {
    customers: count("SELECT COUNT(*) AS n FROM users WHERE role = 'customer'"),
    listings: count('SELECT COUNT(*) AS n FROM listings'),
    activeListings: count("SELECT COUNT(*) AS n FROM listings WHERE status = 'active'"),
    products: count('SELECT COUNT(*) AS n FROM products'),
    orders: count('SELECT COUNT(*) AS n FROM orders'),
    bookings: count('SELECT COUNT(*) AS n FROM bookings'),
    sellRequests: count('SELECT COUNT(*) AS n FROM sell_requests'),
    inquiries: count('SELECT COUNT(*) AS n FROM inquiries'),
    revenuePaise: (
      db.prepare("SELECT COALESCE(SUM(totalPaise), 0) AS n FROM orders WHERE status != 'cancelled'")
        .get() as Count
    ).n,
  };
}

export interface QueueRow {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  payload: string;
  quotedPaise?: number;
  totalPaise?: number;
}

const QUEUES = {
  orders: { table: 'orders', ref: 'orderNumber' },
  bookings: { table: 'bookings', ref: 'reference' },
  sellRequests: { table: 'sell_requests', ref: 'reference' },
  inquiries: { table: 'inquiries', ref: 'id' },
} as const;

export type QueueName = keyof typeof QUEUES;

/** Paginated queue rows for the admin tables. */
export function listQueue(
  queue: QueueName,
  page = 1,
  pageSize = 20,
): { items: QueueRow[]; total: number; page: number; totalPages: number } {
  const { table, ref } = QUEUES[queue];
  const total = count(`SELECT COUNT(*) AS n FROM ${table}`);
  const money = queue === 'orders' ? 'totalPaise,' : queue === 'sellRequests' ? 'quotedPaise,' : '';

  const items = rows<QueueRow>(
    db
      .prepare(
        `SELECT id, ${ref} AS reference, status, createdAt, ${money} payload
           FROM ${table}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?`,
      )
      .all(pageSize, (Math.max(1, page) - 1) * pageSize),
  );

  return { items, total, page: Math.max(1, page), totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

/** Parse the stored JSON blob defensively — old rows may predate a field. */
export function readPayload<T = Record<string, unknown>>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return {} as T;
  }
}

export function setQueueStatus(
  queue: QueueName,
  id: string,
  status: string,
): boolean {
  const { table } = QUEUES[queue];
  return (
    db.prepare(`UPDATE ${table} SET status = ?, updatedAt = ? WHERE id = ?`)
      .run(status, new Date().toISOString(), id).changes > 0
  );
}

export function listUsersWithCounts() {
  return (
    db
      .prepare(
        `SELECT u.id, u.email, u.name, u.phone, u.role, u.createdAt,
                (SELECT COUNT(*) FROM listings l WHERE l.userId = u.id) AS listingCount
           FROM users u
          ORDER BY u.createdAt DESC
          LIMIT 200`,
      )
      .all() as Array<Record<string, unknown>>
  ).map((r) => row(r));
}
