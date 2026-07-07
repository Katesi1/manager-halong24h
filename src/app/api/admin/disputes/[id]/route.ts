import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getDisputeAction } from '@/app/actions/disputes';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — chi tiết 1 khiếu nại. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const { id } = await params;
  const res = await getDisputeAction(id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 502 });
  }
  if (!res.data) {
    return NextResponse.json({ error: 'Không tìm thấy khiếu nại' }, { status: 404 });
  }
  return NextResponse.json({ data: res.data });
}
