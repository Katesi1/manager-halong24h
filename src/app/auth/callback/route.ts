import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth callback (Google login).
 *
 * Spec API: `POST /auth/google` — FE gửi `idToken` từ Google Sign-In SDK.
 * Endpoint này hiện chưa được dùng (login Google sẽ wire sau).
 */
export function GET(_request: NextRequest) {
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  );
}
