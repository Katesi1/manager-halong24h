import { NextResponse } from 'next/server';

import { logoutAction } from '@/app/actions/auth';

export async function POST() {
  // logoutAction đã handle clearTokens + redirect /login
  await logoutAction();
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
    { status: 303 },
  );
}
