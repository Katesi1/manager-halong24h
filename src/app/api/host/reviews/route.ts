import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listPropertyReviewsAction } from '@/app/actions/reviews';
import { isManagerRole } from '@/core/value-objects/role';

/**
 * BFF route (host) — danh sách review của 1 cơ sở. Guard managerRole +
 * ownership check nằm trong action (`requireOwnerOfProperty`).
 */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const propertyId = new URL(request.url).searchParams.get('propertyId');
  if (!propertyId) {
    return NextResponse.json({ error: 'Thiếu mã cơ sở' }, { status: 400 });
  }

  const result = await listPropertyReviewsAction(propertyId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
