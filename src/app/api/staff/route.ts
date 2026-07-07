import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listStaffAction, listStaffInvitesAction } from '@/app/actions/staff';
import { isManagerRole } from '@/core/value-objects/role';

/** BFF route — client fetch SALE đang hoạt động + lời mời đang chờ (2 list). */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const [staffResult, invitesResult] = await Promise.all([
    listStaffAction({ isActive: true }),
    listStaffInvitesAction({ status: 'pending' }),
  ]);
  const error =
    (!staffResult.ok ? staffResult.error : null) ||
    (!invitesResult.ok ? invitesResult.error : null);
  if (error) {
    return NextResponse.json({ error }, { status: 502 });
  }
  return NextResponse.json({
    data: {
      staff: staffResult.ok ? staffResult.data : [],
      invites: invitesResult.ok ? invitesResult.data : [],
    },
  });
}
