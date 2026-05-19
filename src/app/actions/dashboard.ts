'use server';

import { getDashboardReportsUseCase } from '@/application/dashboard/get-reports';
import { getDashboardStatsUseCase } from '@/application/dashboard/get-stats';
import { dashboardRepository } from '@/infrastructure/container';
import { requireManagerRole } from '@/lib/auth-guard';

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
