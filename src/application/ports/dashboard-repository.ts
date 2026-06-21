import type {
  DashboardReport,
  DashboardStats,
  ReportFilters,
} from '@/core/entities/dashboard';
import type { RiskKpis, RiskRange } from '@/core/entities/risk-kpi';

export interface DashboardRepository {
  getStats(): Promise<DashboardStats>;
  getReports(filters?: ReportFilters): Promise<DashboardReport>;
  /** Spec §7A.5 — KPI rủi ro vận hành cho admin (ADMIN-only). */
  getRiskKpis(range: RiskRange): Promise<RiskKpis>;
}
