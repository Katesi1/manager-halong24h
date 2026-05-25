import { NextResponse, type NextRequest } from 'next/server';

/**
 * OAuth callback (Google login).
 * Endpoint này hiện chưa được dùng (login Google sẽ wire sau).
 */
export function GET(_request: NextRequest) {
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL!),
  );
}
