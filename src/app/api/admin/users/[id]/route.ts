import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getAdminUserAction } from '@/app/actions/admin-users';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — chi tiết 1 người dùng. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const { id } = await params;
  const res = await getAdminUserAction(id);
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 502 });
  }
  if (!res.data) {
    return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  }
  return NextResponse.json({ data: res.data });
}
