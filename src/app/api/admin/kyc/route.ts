import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listKycAdminAction } from '@/app/actions/kyc-admin';
import type { KycQueueFilter } from '@/core/entities/kyc-admin';
import { isAdmin } from '@/core/value-objects/role';

const PAGE_SIZE = 10;

function parseFilter(raw: string | null): KycQueueFilter {
  if (raw === '1') return 1;
  if (raw === '2') return 2;
  if (raw === '3') return 3;
  return 0;
}

/** BFF route (ADMIN) — hàng đợi KYC (phân trang + filter + search server-side). */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const result = await listKycAdminAction({
    filter: parseFilter(sp.get('filter')),
    page,
    pageSize: PAGE_SIZE,
    search: sp.get('q') ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
