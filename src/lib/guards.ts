import 'server-only';
import { redirect } from 'next/navigation';
import { currentUser, ensureAdminUser, type User } from '@/lib/auth';

/**
 * Server-side route guards.
 *
 * Every admin page and admin API calls `requireAdmin()` first. This is the
 * check that actually matters -- middleware alone is not enough, because a
 * route handler or server component will happily render if middleware is
 * bypassed or misrouted. Middleware here is a convenience that saves a
 * render; this function is the security boundary.
 */

export function requireUser(returnTo = '/account'): User {
  bootstrapAdmin();
  const user = currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return user;
}

export function requireAdmin(): User {
  bootstrapAdmin();
  const user = currentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent('/admin')}`);
  if (user.role !== 'admin') redirect('/account');
  return user;
}

/**
 * Seeds the admin account on first use.
 *
 * Without this, the admin only exists after a customer happens to register,
 * which makes a fresh install mysteriously unable to sign in. Called on every
 * guarded render; it is a cheap `SELECT COUNT(*)` once the account exists.
 * Failures are swallowed so a misconfigured env var can never 500 a page.
 */
function bootstrapAdmin(): void {
  try {
    ensureAdminUser();
  } catch (error) {
    console.error('[auth] admin bootstrap failed:', error);
  }
}

/** Non-redirecting variants for API route handlers. */
export function apiUser(): User | null {
  return currentUser();
}

export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}
