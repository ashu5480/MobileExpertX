import {
  createSession,
  ensureAdminUser,
  findUserByEmail,
  setSessionCookie,
  verifyPassword,
} from '@/lib/auth';
import { clientKey, jsonError, normalizeEmail, rateLimit, readJson } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/auth/login */
export async function POST(request: Request) {
  // Ten attempts per IP per 15 minutes: enough for a fat-fingered user,
  // far too slow for online password guessing.
  if (!rateLimit(clientKey(request, 'login'), 10, 15 * 60 * 1000)) {
    return jsonError('Too many attempts. Please try again in a few minutes.', undefined, 429);
  }

  // Seed the admin on first sign-in attempt, so a fresh install works
  // immediately instead of needing a customer to register first.
  try {
    ensureAdminUser();
  } catch (error) {
    console.error('[auth] admin bootstrap failed:', error);
  }

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const email = normalizeEmail(body.email);
  const password = String(body.password ?? '');

  if (!email || !password) {
    return jsonError('Enter your email and password.', {
      ...(email ? {} : { email: 'Enter your email.' }),
      ...(password ? {} : { password: 'Enter your password.' }),
    });
  }

  const user = findUserByEmail(email);

  // One message for both "no such user" and "wrong password", so the response
  // cannot be used to discover which emails are registered.
  const invalid = jsonError('Email or password is incorrect.');
  if (!user) return invalid;
  if (!verifyPassword(password, user.passwordHash)) return invalid;

  setSessionCookie(createSession(user.id));

  const { passwordHash, ...safe } = user;
  void passwordHash;
  return Response.json({ user: safe });
}
