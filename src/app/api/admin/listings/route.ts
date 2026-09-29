import { apiUser, isAdmin } from '@/lib/guards';
import { setListingStatus } from '@/lib/listings';
import { jsonError, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES = ['active', 'sold', 'hidden'];

/** PATCH /api/admin/listings -- { id, status } */
export async function PATCH(request: Request) {
  const user = apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);
  if (!isAdmin(user)) return jsonError('Admin access required.', undefined, 403);

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const id = String(body.id ?? '');
  const status = String(body.status ?? '');
  if (!id) return jsonError('An id is required.');
  if (!STATUSES.includes(status)) return jsonError('That status is not valid.');

  if (!setListingStatus(id, status)) {
    return jsonError('Item not found.', undefined, 404);
  }
  return Response.json({ ok: true });
}
