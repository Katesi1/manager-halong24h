import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listDisputesAction } from '@/app/actions/disputes';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — toàn bộ khiếu nại; count/filter phía client. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const result = await listDisputesAction();
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
