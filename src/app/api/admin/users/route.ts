import { apiUser, isAdmin } from '@/lib/guards';
import { currentUser, setUserRole, type Role } from '@/lib/auth';
import { jsonError, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES: Role[] = ['customer', 'admin'];

/** PATCH /api/admin/users -- { userId, role } */
export async function PATCH(request: Request) {
  const user = await apiUser();
  if (!user) return jsonError('Please sign in.', undefined, 401);
  if (!isAdmin(user)) return jsonError('Admin access required.', undefined, 403);

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const userId = String(body.userId ?? '');
  const role = String(body.role ?? '') as Role;
  if (!userId) return jsonError('A user id is required.');
  if (!ROLES.includes(role)) return jsonError('That role is not valid.');

  // Guard against an admin demoting themselves and losing all access.
  const me = await currentUser();
  if (userId === me?.id && role !== 'admin') {
    return jsonError('You cannot remove your own admin access.');
  }

  await setUserRole(userId, role);
  return Response.json({ ok: true });
}
