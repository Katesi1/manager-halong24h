import { NextResponse } from 'next/server';

import { logoutAction } from '@/app/actions/auth';

export async function POST() {
  await logoutAction();
  return NextResponse.redirect(
    new URL('/login', process.env.NEXT_PUBLIC_SITE_URL!),
    { status: 303 },
  );
}
