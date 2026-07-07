import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getRiskKpisAction } from '@/app/actions/dashboard';
import { listDisputesAction } from '@/app/actions/disputes';
import { isRiskRange, type RiskRange } from '@/core/entities/risk-kpi';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — KPI rủi ro (theo range) + dispute đang chờ. */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const rangeParam = new URL(request.url).searchParams.get('range') ?? undefined;
  const range: RiskRange = isRiskRange(rangeParam) ? rangeParam : 'month';

  const [kpiRes, disputeListRes] = await Promise.all([
    getRiskKpisAction(range),
    listDisputesAction(),
  ]);

  const recentDisputes = (disputeListRes.ok ? disputeListRes.data : [])
    .filter((d) => d.status === 'open' || d.status === 'investigating')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 6);

  return NextResponse.json({
    data: {
      kpis: kpiRes.ok ? kpiRes.data : null,
      kpiError: kpiRes.ok ? null : kpiRes.error,
      recentDisputes,
    },
  });
}
