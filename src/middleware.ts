import { NextResponse, type NextRequest } from 'next/server';

/**
 * Early route filtering.
 *
 * This is a UX optimisation, NOT the security boundary. Middleware runs on
 * the Edge runtime and therefore cannot open the SQLite file, so it only
 * checks that a session cookie is present and bounces anonymous users before
 * paying for a render.
 *
 * The real authorisation lives in `requireUser()` / `requireAdmin()`, which
 * every admin page and API route calls. Those run on Node, query the session
 * table, and verify the role -- so they still hold if this matcher is ever
 * changed, misconfigured or bypassed.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/admin') && !pathname.startsWith('/account')) {
    return NextResponse.next();
  }

  if (request.cookies.get('mex_session')?.value) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*'],
};
