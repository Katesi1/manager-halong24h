import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listYachtReviewsAction } from '@/app/actions/yacht-reviews';
import type { YachtReviewFilters } from '@/core/entities/yacht-review';
import { canManageYachts } from '@/lib/yacht-access';

/** BFF (ADMIN + SALE hệ thống) — đánh giá du thuyền; lọc status phía client. */
export async function GET(req: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageYachts(profile)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  const statusParam = sp.get('status');
  const filters: YachtReviewFilters = {
    status:
      statusParam === 'visible' || statusParam === 'hidden'
        ? statusParam
        : 'all',
    pageSize: 200,
  };
  const result = await listYachtReviewsAction(filters);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
