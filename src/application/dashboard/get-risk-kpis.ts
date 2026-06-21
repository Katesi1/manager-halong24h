import type { DashboardRepository } from '../ports/dashboard-repository';
import type { RiskKpis, RiskRange } from '@/core/entities/risk-kpi';

export async function getRiskKpisUseCase(
  repo: DashboardRepository,
  range: RiskRange,
): Promise<RiskKpis> {
  return repo.getRiskKpis(range);
}
