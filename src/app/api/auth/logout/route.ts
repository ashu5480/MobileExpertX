import { cookies } from 'next/headers';
import { SESSION_COOKIE, destroySession } from '@/lib/auth';
import { clientKey, jsonError, rateLimit } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/auth/logout -- deletes the server-side row, not just the cookie. */
export async function POST(request: Request) {
  if (!rateLimit(clientKey(request, 'logout'), 20, 60 * 1000)) {
    return jsonError('Too many requests.', undefined, 429);
  }

  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) destroySession(token);
  cookies().delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
