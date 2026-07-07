import { NextResponse, type NextRequest } from 'next/server';

/**
 * Alias cho link trong email BE (`…/auth/reset-password?token=…`) →
 * redirect sang trang /reset-password, giữ nguyên query (token).
 */
export function GET(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = '/reset-password';
  return NextResponse.redirect(url);
}
