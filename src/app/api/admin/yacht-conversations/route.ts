import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listYachtConversationsAction } from '@/app/actions/yacht-conversations';
import { canManageYachts } from '@/lib/yacht-access';

/** BFF (ADMIN + SALE hệ thống) — danh sách hội thoại du thuyền (B3). ?customerId= optional. */
export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageYachts(profile)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }
  const url = new URL(req.url);
  const customerId = url.searchParams.get('customerId') || undefined;
  const result = await listYachtConversationsAction({ customerId });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
