import 'server-only';
import { db, rows } from '@/lib/db';
import {
  QUEUE_STATUSES,
  type QueueName,
  type QueueRow,
} from '@/lib/admin-shared';

/**
 * Read models for the admin panel. Server-only: it queries SQLite.
 *
 * Aggregates run in SQL rather than in JavaScript so the dashboard cost does
 * not grow with the size of the table.
 */

export { readPayload, type QueueName, type QueueRow } from '@/lib/admin-shared';

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

const QUEUES = {
  orders: { table: 'orders', ref: 'orderNumber' },
  bookings: { table: 'bookings', ref: 'reference' },
  sellRequests: { table: 'sell_requests', ref: 'reference' },
  inquiries: { table: 'inquiries', ref: 'id' },
} as const;

/** Paginated queue rows for the admin tables. */
export function listQueue(
  queue: QueueName,
  page = 1,
  pageSize = 20,
): { items: QueueRow[]; total: number; page: number; totalPages: number } {
  const { table, ref } = QUEUES[queue];
  const total = count(`SELECT COUNT(*) AS n FROM ${table}`);
  const money =
    queue === 'orders' ? 'totalPaise,' : queue === 'sellRequests' ? 'quotedPaise,' : '';

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

  return {
    items,
    total,
    page: Math.max(1, page),
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
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

export interface UserRow {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
  createdAt: string;
  listingCount: number;
}

export function listUsersWithCounts(): UserRow[] {
  return rows<UserRow>(
    db
      .prepare(
        `SELECT u.id, u.email, u.name, u.phone, u.role, u.createdAt,
                (SELECT COUNT(*) FROM listings l WHERE l.userId = u.id) AS listingCount
           FROM users u
          ORDER BY u.createdAt DESC
          LIMIT 200`,
      )
      .all() as unknown[],
  );
}
