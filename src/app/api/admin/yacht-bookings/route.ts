import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listYachtBookingsAction } from '@/app/actions/yacht-bookings';
import { canManageYachts } from '@/lib/yacht-access';

/** BFF (ADMIN + SALE hệ thống) — toàn bộ đơn du thuyền; stats/filter phía client. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageYachts(profile)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }
  const result = await listYachtBookingsAction();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
