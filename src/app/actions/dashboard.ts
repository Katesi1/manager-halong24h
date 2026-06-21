'use server';

import { getDashboardReportsUseCase } from '@/application/dashboard/get-reports';
import { getRiskKpisUseCase } from '@/application/dashboard/get-risk-kpis';
import { getDashboardStatsUseCase } from '@/application/dashboard/get-stats';
import type { RiskRange } from '@/core/entities/risk-kpi';
import { dashboardRepository } from '@/infrastructure/container';
import { requireAdmin, requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function getDashboardStatsAction() {
  return toResult(async () => {
    await requireManagerRole();
    return getDashboardStatsUseCase(dashboardRepository());
  });
}

export async function getDashboardReportsAction(filters?: unknown) {
  return toResult(async () => {
    await requireManagerRole();
    return getDashboardReportsUseCase(dashboardRepository(), filters);
  });
}

export async function getRiskKpisAction(range: RiskRange) {
  return toResult(async () => {
    await requireAdmin();
    return getRiskKpisUseCase(dashboardRepository(), range);
  });
}
