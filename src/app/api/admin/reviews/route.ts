import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listReviewsAction } from '@/app/actions/reviews';
import type { ReviewFilters, ReviewStatus } from '@/core/entities/review';
import { isAdmin } from '@/core/value-objects/role';

function parseStatus(v: string | null): ReviewStatus | undefined {
  if (v === 'published' || v === 'hidden' || v === 'deleted') return v;
  return undefined;
}

/** BFF route (ADMIN) — review đã lọc theo status/flagged/search. */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const flagged = sp.get('flagged') === '1';
  const filters: ReviewFilters = {
    status: flagged ? undefined : parseStatus(sp.get('status')),
    flagged: flagged || undefined,
    search: sp.get('q')?.trim() || undefined,
  };

  const result = await listReviewsAction(filters);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
