import type { DashboardStats } from '@/core/entities/dashboard';
import type { DashboardRepository } from '../ports/dashboard-repository';

export async function getDashboardStatsUseCase(
  repo: DashboardRepository,
): Promise<DashboardStats> {
  return repo.getStats();
}
