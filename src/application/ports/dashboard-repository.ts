import type {
  DashboardReport,
  DashboardStats,
  ReportFilters,
} from '@/core/entities/dashboard';

export interface DashboardRepository {
  getStats(): Promise<DashboardStats>;
  getReports(filters?: ReportFilters): Promise<DashboardReport>;
}
