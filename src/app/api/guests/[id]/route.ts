import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getGuestAction } from '@/app/actions/guests';
import { isManagerRole } from '@/core/value-objects/role';

/** BFF route — client fetch chi tiết 1 khách. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const res = await getGuestAction(id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 502 });
  }
  if (!res.data) {
    return NextResponse.json({ error: 'Không tìm thấy khách' }, { status: 404 });
  }
  return NextResponse.json({ data: res.data });
}
