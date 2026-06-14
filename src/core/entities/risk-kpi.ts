/**
 * Risk KPIs — spec §7A.5 `GET /admin/reports/risk-kpis?range=`.
 *
 * Bộ chỉ số rủi ro vận hành cho trang `/admin/reports`. BE trả 1 lần đủ cho
 * cards + bảng top host cancel + delta vs kỳ trước. Mỗi metric `{ value, prev }`
 * (prev = cùng window N ngày liền trước) để FE tính biến động.
 */

export type RiskRange = 'week' | 'month' | 'quarter' | 'year';

export const RISK_RANGES: RiskRange[] = ['week', 'month', 'quarter', 'year'];

export const RISK_RANGE_LABEL: Record<RiskRange, string> = {
  week: '7 ngày',
  month: '30 ngày',
  quarter: '90 ngày',
  year: '365 ngày',
};

export interface RiskMetric {
  value: number;
  prev: number;
  note?: string;
}

export interface TopHostCancelRow {
  ownerId: string;
  name: string;
  propertyCount: number;
  bookingCount: number;
  cancelCount: number;
  cancelRate: number;
}

export interface RiskKpis {
  range: RiskRange;
  rangeDays: number;
  disputesOpen: RiskMetric;
  flaggedReviews: RiskMetric;
  kycPending: RiskMetric;
  /** Snapshot hiện tại — `prev = value`, FE ẩn delta. */
  subscriptionOverdue: RiskMetric;
  /** VND đã thu trong kỳ. */
  revenuePaid: RiskMetric;
  deletionRequests: RiskMetric;
  /** % — tổng cancelled / tổng booking trong kỳ. */
  cancelRate: RiskMetric;
  /** % — host/sale/admin cancel / booking đã cọc trong kỳ. */
  hostCancelRate: RiskMetric;
  /** % — booking NO_SHOW / booking đã cọc trong kỳ. */
  noShowRate: RiskMetric;
  topHostCancel: TopHostCancelRow[];
}

export function isRiskRange(v: string | undefined): v is RiskRange {
  return !!v && (RISK_RANGES as string[]).includes(v);
}
