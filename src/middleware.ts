import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware Clean Architecture — không phụ thuộc Supabase.
 *
 * Trách nhiệm:
 *  - Kiểm tra TOKEN cookie tồn tại (defense-in-depth tier 1).
 *  - Cho phép public paths (login/signup/forgot-password, /api/auth) đi qua.
 *  - Honor `DEV_BYPASS_AUTH=1` chỉ ở môi trường non-production.
 *
 * Auth check chi tiết (role/permission) vẫn nằm ở `(admin)/layout.tsx`,
 * `(host)/layout.tsx`, và `requireXXX()` trong các Server Action.
 *
 * TODO: Add rate limiting for /login + /forgot-password (5 attempts / 15 min per IP).
 *       Use lru-cache or upstash/ratelimit when implementing.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Public paths không cần auth token
  const publicPaths = ['/login', '/signup', '/forgot-password'];
  if (
    publicPaths.some((p) => path.startsWith(p)) ||
    path.startsWith('/_next') ||
    path.startsWith('/api/auth')
  ) {
    return NextResponse.next();
  }

  // DEV_BYPASS_AUTH=1 → bỏ qua middleware (CHỈ ở môi trường dev/staging).
  // Production guard: NEVER honor bypass khi NODE_ENV=production.
  if (
    process.env.DEV_BYPASS_AUTH === '1' &&
    process.env.NODE_ENV !== 'production'
  ) {
    return NextResponse.next();
  }

  // Kiểm tra cookie token (cookies set bởi `writeTokens()` trong token-storage.ts).
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
