import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listBankAccountsAction } from '@/app/actions/bank-accounts';
import type { BankQueueFilter } from '@/core/entities/bank-account';
import { isAdmin } from '@/core/value-objects/role';

const PAGE_SIZE = 20;

function parseFilter(raw: string | null): BankQueueFilter {
  if (raw === 'approved' || raw === 'rejected' || raw === 'all') return raw;
  return 'pending';
}

/** BFF route (ADMIN) — hàng đợi duyệt STK (phân trang + filter server-side). */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10) || 1);
  const result = await listBankAccountsAction({
    filter: parseFilter(sp.get('status')),
    page,
    limit: PAGE_SIZE,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
