import { NextResponse, type NextRequest } from 'next/server';

/**
 * Early route filtering.
 *
 * This is a UX optimisation, not the security boundary -- it avoids rendering
 * a page for someone who will be bounced anyway. The real checks are
 * `requireUser()` / `requireAdmin()` inside each page and API route, because
 * those run even if this matcher is ever changed or bypassed.
 *
 * The session token is opaque and random, so validating it here is just a
 * database lookup for the row's existence and expiry.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('mex_session')?.value;
  const role = token ? await lookupRole(token) : null;

  const isAdminArea = pathname.startsWith('/admin');
  const isAccountArea = pathname.startsWith('/account');

  if (!isAdminArea && !isAccountArea) return NextResponse.next();

  if (!role) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }

  // A logged-in customer must never land on an admin page, even by typing
  // the URL directly.
  if (isAdminArea && role !== 'admin') {
    const url = request.nextUrl.clone();
    url.pathname = '/account';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

async function lookupRole(token: string): Promise<'admin' | 'customer' | null> {
  try {
    const { db } = await import('@/lib/db');
    const found = db
      .prepare(
        `SELECT u.role, s.expiresAt
           FROM sessions s JOIN users u ON u.id = s.userId
          WHERE s.token = ?`,
      )
      .get(token) as { role?: string; expiresAt?: number } | undefined;

    if (!found?.role) return null;
    if (Number(found.expiresAt) < Date.now()) return null;
    return found.role === 'admin' ? 'admin' : 'customer';
  } catch {
    return null;
  }
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
