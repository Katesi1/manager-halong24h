import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listLeadsAction } from '@/app/actions/leads';
import { isManagerRole } from '@/core/value-objects/role';

/** BFF route — client fetch toàn bộ yêu cầu (lead); filter/đếm phía client. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const result = await listLeadsAction();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
