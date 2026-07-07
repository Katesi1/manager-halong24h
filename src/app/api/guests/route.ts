import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listGuestsAction } from '@/app/actions/guests';
import type { GuestLabel } from '@/core/entities/guest';
import { isManagerRole } from '@/core/value-objects/role';

/** BFF route — client fetch danh sách khách (phân trang server-side). */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const labelRaw = sp.get('label') ?? '';
  const label = (['vip', 'regular', 'new', 'restricted'] as GuestLabel[]).includes(
    labelRaw as GuestLabel,
  )
    ? (labelRaw as GuestLabel)
    : undefined;
  const pageNum = Number(sp.get('page'));
  const limitNum = Number(sp.get('limit'));

  const result = await listGuestsAction({
    q: sp.get('q')?.trim() || undefined,
    label,
    page: Number.isFinite(pageNum) && pageNum > 0 ? pageNum : undefined,
    limit: Number.isFinite(limitNum) && limitNum > 0 ? limitNum : undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
