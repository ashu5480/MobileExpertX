import { isAdmin, apiUser } from '@/lib/guards';
import { listQueue, setQueueStatus, type QueueName } from '@/lib/adminService';
import { jsonError, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Only the four known tables can ever be named in a query. */
const QUEUES: QueueName[] = ['orders', 'bookings', 'sellRequests', 'inquiries'];

const ALLOWED: Record<QueueName, string[]> = {
  orders: ['pending', 'confirmed', 'paid', 'shipped', 'delivered', 'cancelled'],
  bookings: ['pending', 'confirmed', 'in_progress', 'ready', 'completed', 'cancelled'],
  sellRequests: ['pending', 'quoted', 'accepted', 'completed', 'declined'],
  inquiries: ['new', 'replied', 'closed'],
};

async function guard(): Promise<Response | null> {
  const user = await apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);
  // 403 here, not a redirect: this is an API, the client shows the message.
  if (!isAdmin(user)) return jsonError('Admin access required.', undefined, 403);
  return null;
}

/** GET /api/admin/:queue?page=1 */
export async function GET(request: Request, { params }: { params: { queue: string } }) {
  const denied = await guard();
  if (denied) return denied;

  const queue = params.queue as QueueName;
  if (!QUEUES.includes(queue)) return jsonError('Unknown queue.', undefined, 404);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  return Response.json(await listQueue(queue, page, 20));
}

/** PATCH /api/admin/:queue -- { id, status } */
export async function PATCH(request: Request, { params }: { params: { queue: string } }) {
  const denied = await guard();
  if (denied) return denied;

  const queue = params.queue as QueueName;
  if (!QUEUES.includes(queue)) return jsonError('Unknown queue.', undefined, 404);

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const id = String(body.id ?? '');
  const status = String(body.status ?? '');
  if (!id) return jsonError('An id is required.');

  // Allow-list the status too, so a typo cannot invent a new state.
  if (!ALLOWED[queue].includes(status)) {
    return jsonError('That status is not valid for this queue.');
  }

  if (!await setQueueStatus(queue, id, status)) {
    return jsonError('Record not found.', undefined, 404);
  }
  return Response.json({ ok: true });
}
