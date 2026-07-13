import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getYachtAction } from '@/app/actions/yachts';
import { canManageYachts } from '@/lib/yacht-access';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageYachts(profile)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }
  const { id } = await params;
  const result = await getYachtAction(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  if (!result.data) {
    return NextResponse.json({ error: 'Không tìm thấy du thuyền' }, { status: 404 });
  }
  return NextResponse.json({ data: result.data });
}
