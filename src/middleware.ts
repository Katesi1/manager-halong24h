import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware — kiểm tra token cookie tồn tại (defense-in-depth tier 1).
 *
 * Auth check chi tiết (role/permission) nằm ở `(admin)/layout.tsx`,
 * `(host)/layout.tsx`, và `requireXXX()` trong các Server Action.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const publicPaths = ['/login', '/signup', '/forgot-password', '/legal'];
  if (
    publicPaths.some((p) => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  const hasAccessToken = request.cookies.has('h24h_access');
  const hasRefreshToken = request.cookies.has('h24h_refresh');

  if (!hasAccessToken && !hasRefreshToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
