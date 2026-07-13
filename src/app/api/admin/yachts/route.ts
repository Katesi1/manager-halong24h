import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listYachtsAction } from '@/app/actions/yachts';
import { canManageYachts } from '@/lib/yacht-access';

/** BFF (ADMIN + SALE hệ thống) — toàn bộ du thuyền; filter/phân trang phía client. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !canManageYachts(profile)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }
  const result = await listYachtsAction({ includeInactive: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
