import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getPropertyAction } from '@/app/actions/properties';
import { isManagerRole } from '@/core/value-objects/role';

/** BFF route — client fetch chi tiết 1 cơ sở. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;
  const res = await getPropertyAction(id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 502 });
  }
  if (!res.data) {
    return NextResponse.json({ error: 'Không tìm thấy cơ sở' }, { status: 404 });
  }
  return NextResponse.json({ data: res.data });
}
