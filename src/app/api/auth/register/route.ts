import { createSession, createUser, ensureAdminUser, setSessionCookie } from '@/lib/auth';
import {
  EMAIL_RE,
  clientKey,
  jsonError,
  normalizeEmail,
  rateLimit,
  readJson,
  type FieldErrors,
} from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /api/auth/register -- create a customer account. */
export async function POST(request: Request) {
  // Seed the admin account on first boot so a fresh install is usable.
  try {
    await ensureAdminUser();
  } catch (error) {
    console.error('[auth] admin bootstrap failed:', error);
  }

  if (!rateLimit(clientKey(request, 'register'), 5, 60 * 60 * 1000)) {
    return jsonError('Too many attempts. Please try again later.', undefined, 429);
  }

  const body = await readJson(request);
  if (!body) return jsonError('Invalid request body.');

  const name = String(body.name ?? '').trim().slice(0, 80);
  const email = normalizeEmail(body.email);
  const phone = String(body.phone ?? '').trim().slice(0, 20);
  const password = String(body.password ?? '');

  const fieldErrors: FieldErrors = {};
  if (name.length < 2) fieldErrors.name = 'Please enter your name.';
  if (!EMAIL_RE.test(email)) fieldErrors.email = 'Please enter a valid email address.';
  // Length is the control that matters; composition rules just push people
  // toward writing the password on a sticky note.
  if (password.length < 8) fieldErrors.password = 'Use at least 8 characters.';
  if (password.length > 200) fieldErrors.password = 'That password is too long.';

  if (Object.keys(fieldErrors).length) {
    return jsonError('Please correct the highlighted fields.', fieldErrors);
  }

  // Self-registration can only ever create a customer. Promotion to admin is a
  // separate authenticated action, so nobody can POST their way to admin.
  const user = await createUser({
    email,
    password,
    name,
    phone: phone || null,
    role: 'customer',
  });
  if (!user) {
    return jsonError('An account with that email already exists.', {
      email: 'This email is already registered.',
    });
  }

  setSessionCookie(await createSession(user.id));
  return Response.json({ user }, { status: 201 });
}
