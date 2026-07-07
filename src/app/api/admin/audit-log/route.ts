import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listAuditEntriesAction } from '@/app/actions/audit-log';
import type { AuditFilters, AuditTargetType } from '@/core/entities/audit-log';
import { isAdmin } from '@/core/value-objects/role';

function parseTarget(v: string | null): AuditTargetType | undefined {
  const allowed: AuditTargetType[] = [
    'kyc',
    'user',
    'property',
    'booking',
    'dispute',
    'subscription',
    'review',
  ];
  return allowed.includes(v as AuditTargetType)
    ? (v as AuditTargetType)
    : undefined;
}

/** BFF route (ADMIN) — nhật ký kiểm toán (filter target/q server-side). */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const filters: AuditFilters = {
    targetType: parseTarget(sp.get('target')),
    q: sp.get('q')?.trim() || undefined,
    limit: 200,
  };

  const result = await listAuditEntriesAction(filters);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
