import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, id, now, row } from '@/lib/db';

/**
 * ────────────────────────────────────────────────────────────────────────────
 *  Authentication
 * ────────────────────────────────────────────────────────────────────────────
 *  - Passwords: scrypt (Node built-in, memory-hard) with a per-user salt.
 *  - Sessions: a random 256-bit token stored in SQLite, sent as an httpOnly
 *    cookie so client JavaScript can never read it.
 *
 *  Deliberately not a JWT: a self-signed token keeps working after you log
 *  out. A server-side row can be deleted instantly, which is what "log out"
 *  and "ban this user" both need.
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

export function createSession(userId: string): string {
  const token = randomBytes(32).toString('hex');
  db.prepare(
    'INSERT INTO sessions (token, userId, expiresAt, createdAt) VALUES (?, ?, ?, ?)',
  ).run(token, userId, Date.now() + SESSION_TTL_MS, now());
  return token;
}

export function destroySession(token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function userForToken(token: string | undefined): User | null {
  if (!token) return null;
  const found = db
    .prepare(
      `SELECT u.id, u.email, u.name, u.phone, u.role, u.createdAt, s.expiresAt
         FROM sessions s JOIN users u ON u.id = s.userId
        WHERE s.token = ?`,
    )
    .get(token) as Record<string, unknown> | undefined;
  if (!found) return null;
  if (Number(found.expiresAt) < Date.now()) {
    destroySession(token);
    return null;
  }
  return row<User>({
    id: found.id,
    email: found.email,
    name: found.name,
    phone: found.phone,
    role: found.role,
    createdAt: found.createdAt,
  });
}

export function currentUser(): User | null {
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

export function createUser(args: {
  email: string;
  password: string;
  name: string;
  phone?: string | null;
  role?: Role;
}): User | null {
  const email = args.email.trim().toLowerCase();
  if (findUserByEmail(email)) return null;

  const user = {
    id: id('usr'),
    email,
    passwordHash: hashPassword(args.password),
    name: args.name.trim(),
    phone: args.phone?.trim() || null,
    role: (args.role ?? 'customer') as Role,
    createdAt: now(),
  };
  db.prepare(
    `INSERT INTO users (id, email, passwordHash, name, phone, role, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    user.id,
    user.email,
    user.passwordHash,
    user.name,
    user.phone,
    user.role,
    user.createdAt,
  );

  const { passwordHash, ...safe } = user;
  void passwordHash;
  return safe;
}

export function findUserByEmail(email: string): (User & { passwordHash: string }) | null {
  const found = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(email.trim().toLowerCase()) as Record<string, unknown> | undefined;
  return found ? row<User & { passwordHash: string }>(found) : null;
}

export function listUsers(): User[] {
  return (
    db
      .prepare(
        'SELECT id, email, name, phone, role, createdAt FROM users ORDER BY createdAt DESC',
      )
      .all() as Array<Record<string, unknown>>
  ).map((r) => row<User>(r));
}

export function setUserRole(userId: string, role: Role): void {
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
}

/* ── First-run admin ──────────────────────────────────────────────────────── */

/**
 * Creates the single admin account the first time the database is empty.
 *
 * Credentials come from the environment -- never from source, never a
 * hardcoded default. If they are absent the site still boots, but nobody can
 * sign in as admin until they are set. That fails closed rather than open.
 */
export function ensureAdminUser(): { created: boolean; email?: string } {
  const existing = db
    .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'")
    .get() as { n: number };
  if (existing.n > 0) return { created: false };

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return { created: false };
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  }

  try {
    const created = createUser({
      email,
      password,
      name: process.env.ADMIN_NAME?.trim() || 'Administrator',
      role: 'admin',
    });
    return { created: Boolean(created), email };
  } catch (error) {
    // `next build` collects page data in parallel worker processes, so two of
    // them can race to seed the same admin. The loser sees a UNIQUE
    // constraint on the email -- which just means the account now exists.
    const message = error instanceof Error ? error.message : String(error);
    if (/UNIQUE constraint failed/i.test(message)) {
      return { created: false, email };
    }
    throw error;
  }
}
