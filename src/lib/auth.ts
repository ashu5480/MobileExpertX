import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { id, isDuplicateKey, now, sessions, users } from '@/lib/mongo';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Authentication
 * ────────────────────────────────────────────────────────────────────────────
 *  - Passwords: scrypt (Node built-in, memory-hard) with a per-user salt.
 *  - Sessions: a random 256-bit token stored in MongoDB, sent as an httpOnly
 *    cookie so client JavaScript can never read it.
 *
 *  Deliberately not a JWT: a self-signed token keeps working after you log
 *  out. A server-side document can be deleted instantly, which is what "log
 *  out" and "ban this user" both need. Storing that document in MongoDB (not
 *  SQLite on local disk, and not process memory) is what makes a session
 *  survive a cold start and a redeploy.
 *
 *  Every function here is async because the database is. The hashing itself
 *  stays synchronous — scryptSync on a 64-byte key is a few milliseconds and
 *  blocking it does not measurably hurt a serverless invocation.
 */

export const SESSION_COOKIE = 'mex_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

export type Role = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

/* ── Password hashing ─────────────────────────────────────────────────────── */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, expected.length);
  // timingSafeEqual throws on a length mismatch, so guard first.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* ── Sessions ─────────────────────────────────────────────────────────────── */

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await (await sessions()).insertOne({
    _id: token,
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
    createdAt: now(),
  });
  return token;
}

export async function destroySession(token: string): Promise<void> {
  await (await sessions()).deleteOne({ _id: token });
}

export async function userForToken(token: string | undefined): Promise<User | null> {
  if (!token) return null;

  const collection = await sessions();
  const session = await collection.findOne({ _id: token });
  if (!session) return null;

  // The TTL index reaps these eventually, but checking here means an expired
  // cookie stops authenticating the instant it lapses rather than whenever
  // the reaper next runs.
  if (session.expiresAt.getTime() < Date.now()) {
    void collection.deleteOne({ _id: token });
    return null;
  }

  const found = await (await users()).findOne({ _id: session.userId });
  if (!found) return null;

  return {
    id: found._id,
    email: found.email,
    name: found.name,
    phone: found.phone,
    role: found.role,
    createdAt: found.createdAt.toISOString(),
  };
}

export async function currentUser(): Promise<User | null> {
  return userForToken(cookies().get(SESSION_COOKIE)?.value);
}

export function setSessionCookie(token: string): void {
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Secure in production, so the cookie is never sent over plain HTTP.
    // Opt out explicitly for local testing against http://localhost.
    secure: process.env.NODE_ENV === 'production' && process.env.MEX_INSECURE_COOKIE !== '1',
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}


/* ── Users ────────────────────────────────────────────────────────────────── */

export async function createUser(args: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role?: Role;
}): Promise<User | null> {
  const email = args.email.trim().toLowerCase();
  if (await findUserByEmail(email)) return null;

  const user = {
    _id: id('usr'),
    email,
    passwordHash: hashPassword(args.password),
    name: args.name.trim(),
    phone: args.phone?.trim() || null,
    role: (args.role ?? 'customer') as Role,
    createdAt: now(),
  };
  await (await users()).insertOne(user);

  const { passwordHash, ...safe } = user;
  void passwordHash;
  return {
    id: safe._id,
    email: safe.email,
    name: safe.name,
    phone: safe.phone,
    role: safe.role,
    createdAt: safe.createdAt.toISOString(),
  };
}

export async function findUserByEmail(
  email: string,
): Promise<(User & { passwordHash: string }) | null> {
  const found = await (await users()).findOne({ email: email.trim().toLowerCase() });
  if (!found) return null;
  return {
    id: found._id,
    email: found.email,
    name: found.name,
    phone: found.phone,
    role: found.role,
    createdAt: found.createdAt.toISOString(),
    passwordHash: found.passwordHash,
  };
}

export async function listUsers(): Promise<User[]> {
  const all = await (await users()).find().sort({ createdAt: -1 }).toArray();
  return all.map((u) => ({
    id: u._id,
    email: u.email,
    name: u.name,
    phone: u.phone,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function setUserRole(userId: string, role: Role): Promise<void> {
  await (await users()).updateOne({ _id: userId }, { $set: { role } });
}

/* ── First-run admin ──────────────────────────────────────────────────────── */

/**
 * Creates the single admin account the first time the database is empty.
 *
 * Credentials come from the environment -- never from source, never a
 * hardcoded default. If they are absent the site still boots, but nobody can
 * sign in as admin until they are set. That fails closed rather than open.
 */
export async function ensureAdminUser(): Promise<{ created: boolean; email?: string }> {
  const existing = await (await users()).countDocuments({ role: 'admin' });
  if (existing > 0) return { created: false };

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return { created: false };
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  }

  try {
    const created = await createUser({
      email,
      password,
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      role: 'admin',
    });
    return { created: Boolean(created), email };
  } catch (error) {
    // Two serverless invocations can race to seed the same admin on a cold
    // start. The loser trips the unique index on email -- which just means the
    // account now exists, so that is a success, not a failure.
    if (isDuplicateKey(error)) return { created: false, email };
    throw error;
  }
}

