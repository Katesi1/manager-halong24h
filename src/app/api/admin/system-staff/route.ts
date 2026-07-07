import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listSystemSalesAction } from '@/app/actions/system-staff';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — danh sách SALE hệ thống. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const result = await listSystemSalesAction();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
