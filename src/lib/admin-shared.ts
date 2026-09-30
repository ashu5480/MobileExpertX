/**
 * Client-safe admin constants and helpers.
 *
 * Kept separate from `adminService.ts`, which is `server-only` because it
 * queries SQLite. Client components import from here instead.
 */

export type QueueName = 'orders' | 'bookings' | 'sellRequests' | 'inquiries';

export interface QueueRow {
  id: string;
  reference: string;
  status: string;
  createdAt: string;
  payload: string;
  totalPaise?: number;
  quotedPaise?: number;
}

/**
 * The only statuses each queue accepts. The API validates against the same
 * list, so the dropdown and the server can never disagree.
 */
export const QUEUE_STATUSES: Record<QueueName, string[]> = {
  orders: ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'],
  bookings: ['pending', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled'],
  sellRequests: ['pending', 'quoted', 'accepted', 'completed', 'declined'],
  inquiries: ['new', 'replied', 'closed'],
};

/** Parse the stored JSON blob defensively -- a field may predate a schema. */
export function readPayload<T = Record<string, string | number>>(json: string): T {
  try {
    const parsed = JSON.parse(json);
    return (parsed ?? {}) as T;
  } catch {
    return {} as T;
  }
}
