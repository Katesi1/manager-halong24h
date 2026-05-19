import 'server-only';

import type {
  DashboardReport,
  DashboardStats,
  ReportFilters,
} from '@/core/entities/dashboard';
import type { DashboardRepository } from '@/application/ports/dashboard-repository';

import { apiClient } from '../http/api-client';

export class ApiDashboardRepository implements DashboardRepository {
  async getStats(): Promise<DashboardStats> {
    return apiClient.get<DashboardStats>('/dashboard/stats', {
      cache: 'no-store',
    });
  }

  async getReports(filters?: ReportFilters): Promise<DashboardReport> {
    return apiClient.get<DashboardReport>('/reports', {
      query: {
        period: filters?.period,
        from: filters?.from,
        to: filters?.to,
        month: filters?.month,
        year: filters?.year,
      },
      cache: 'no-store',
    });
  }
}
