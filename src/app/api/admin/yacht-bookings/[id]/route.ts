import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getYachtBookingAction } from '@/app/actions/yacht-bookings';
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
  const result = await getYachtBookingAction(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  if (!result.data) {
    return NextResponse.json({ error: 'Không tìm thấy đơn' }, { status: 404 });
  }
  return NextResponse.json({ data: result.data });
}
