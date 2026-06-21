import 'server-only';

import type {
  DashboardReport,
  DashboardStats,
  ReportFilters,
} from '@/core/entities/dashboard';
import type {
  RiskKpis,
  RiskMetric,
  RiskRange,
  TopHostCancelRow,
} from '@/core/entities/risk-kpi';
import type { DashboardRepository } from '@/application/ports/dashboard-repository';

import { apiClient } from '../http/api-client';

type RawMetric = Partial<RiskMetric> | number | null | undefined;

/** Chuẩn hoá metric: chấp nhận `{value,prev}`, số trần, hoặc thiếu → 0. */
function metric(raw: RawMetric): RiskMetric {
  if (typeof raw === 'number') return { value: raw, prev: raw };
  return {
    value: raw?.value ?? 0,
    prev: raw?.prev ?? raw?.value ?? 0,
    note: raw?.note,
  };
}

interface RawRiskKpis {
  range?: RiskRange;
  rangeDays?: number;
  disputesOpen?: RawMetric;
  flaggedReviews?: RawMetric;
  kycPending?: RawMetric;
  subscriptionOverdue?: RawMetric;
  revenuePaid?: RawMetric;
  deletionRequests?: RawMetric;
  cancelRate?: RawMetric;
  hostCancelRate?: RawMetric;
  noShowRate?: RawMetric;
  topHostCancel?: Partial<TopHostCancelRow>[] | null;
}

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

  async getRiskKpis(range: RiskRange): Promise<RiskKpis> {
    const raw = await apiClient.get<RawRiskKpis>('/admin/reports/risk-kpis', {
      query: { range },
      cache: 'no-store',
    });
    return {
      range: raw.range ?? range,
      rangeDays: raw.rangeDays ?? 0,
      disputesOpen: metric(raw.disputesOpen),
      flaggedReviews: metric(raw.flaggedReviews),
      kycPending: metric(raw.kycPending),
      subscriptionOverdue: metric(raw.subscriptionOverdue),
      revenuePaid: metric(raw.revenuePaid),
      deletionRequests: metric(raw.deletionRequests),
      cancelRate: metric(raw.cancelRate),
      hostCancelRate: metric(raw.hostCancelRate),
      noShowRate: metric(raw.noShowRate),
      topHostCancel: (raw.topHostCancel ?? []).map((r) => ({
        ownerId: r.ownerId ?? '',
        name: r.name ?? '',
        propertyCount: r.propertyCount ?? 0,
        bookingCount: r.bookingCount ?? 0,
        cancelCount: r.cancelCount ?? 0,
        cancelRate: r.cancelRate ?? 0,
      })),
    };
  }
}
