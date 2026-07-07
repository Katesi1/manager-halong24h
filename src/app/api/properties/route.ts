import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listPropertiesAction } from '@/app/actions/properties';
import { isManagerRole } from '@/core/value-objects/role';

/**
 * BFF route — client fetch danh sách cơ sở, endpoint hiện trong F12 Network.
 * Token BE giữ ở server (action tự đính từ cookie httpOnly). Xem [api/bookings].
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const result = await listPropertiesAction({ includeInactive: true });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
