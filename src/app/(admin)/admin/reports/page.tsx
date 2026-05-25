import type { Metadata } from 'next';
import Link from 'next/link';

import { PageHeader, StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = { title: 'Báo cáo' };

/**
 * Admin reports — KPI dashboard cho BUSINESS_RISKS §7 review checklist.
 * 5 chỉ số chính giúp admin nhận diện rủi ro vận hành theo quý.
 *
 * Hiện chạy MOCK — khi BE expose `GET /admin/reports/risk-kpis?range=...`
 * thay block `MOCK_DATA` bằng fetch.
 */

type RangeKey = 'week' | 'month' | 'quarter' | 'year';

const RANGE_LABEL: Record<RangeKey, string> = {
  week: 'Tuần này',
  month: 'Tháng này',
  quarter: 'Quý hiện tại',
  year: 'Năm hiện tại',
};

const VALID_RANGES: RangeKey[] = ['week', 'month', 'quarter', 'year'];

function isRange(r?: string): r is RangeKey {
  return !!r && (VALID_RANGES as string[]).includes(r);
}

interface RiskKpi {
  key: string;
  label: string;
  hint: string;
  /** Số tuyệt đối hoặc %. */
  value: string;
  raw: number;
  /** Spark trend (7 mốc) — chỉ để render bar mini. */
  spark: number[];
  /** Delta vs prev period. */
  delta: { value: string; positive: boolean };
  variant: 'danger' | 'warning' | 'success' | 'info';
}

interface MockData {
  range: RangeKey;
  kpis: RiskKpi[];
  topHostCancel: Array<{
    hostName: string;
    propertyCount: number;
    bookingCount: number;
    cancelRate: number;
    flag: 'red' | 'amber' | 'green';
  }>;
  recentDisputes: Array<{
    code: string;
    openedAt: string;
    propertyName: string;
    issue: string;
    status: 'open' | 'investigating' | 'resolved';
  }>;
}

function getMock(range: RangeKey): MockData {
  // Giá trị mặc định "quý hiện tại" theo brief BUSINESS_RISKS §7.
  // Các range khác scale tương đối để demo trend.
  const scale = range === 'week' ? 0.12 : range === 'month' ? 0.4 : range === 'year' ? 3.6 : 1;

  const kpis: RiskKpi[] = [
    {
      key: 'disputes',
      label: 'Dispute mở',
      hint: 'Khiếu nại đang chờ phán quyết',
      value: String(Math.max(1, Math.round(5 * scale))),
      raw: 5 * scale,
      spark: [2, 3, 1, 4, 3, 5, 5],
      delta: { value: '+25%', positive: false },
      variant: 'danger',
    },
    {
      key: 'host_cancel',
      label: 'Chủ huỷ sau confirmed',
      hint: 'Tỉ lệ booking chủ huỷ sau khi đã xác nhận',
      value: `${(3.2 * Math.sqrt(scale)).toFixed(1)}%`,
      raw: 3.2,
      spark: [4.1, 3.6, 3.4, 3.0, 3.5, 3.2, 3.2],
      delta: { value: '−0.4pp', positive: true },
      variant: 'warning',
    },
    {
      key: 'no_show',
      label: 'Khách no-show',
      hint: 'Khách đã cọc nhưng không tới nhận phòng',
      value: `${(1.8 * Math.sqrt(scale)).toFixed(1)}%`,
      raw: 1.8,
      spark: [2.0, 2.2, 1.9, 1.6, 1.7, 1.8, 1.8],
      delta: { value: '−0.2pp', positive: true },
      variant: 'warning',
    },
    {
      key: 'scam_reports',
      label: 'Report scam · fake listing',
      hint: 'Khách hoặc chủ report nội dung gian lận',
      value: String(Math.max(1, Math.round(4 * scale))),
      raw: 4 * scale,
      spark: [1, 2, 2, 3, 3, 4, 4],
      delta: { value: '+33%', positive: false },
      variant: 'danger',
    },
    {
      key: 'deletion_requests',
      label: 'Yêu cầu xoá account',
      hint: 'User yêu cầu xoá theo NĐ 13 — grace 30 ngày',
      value: String(Math.max(0, Math.round(2 * scale))),
      raw: 2 * scale,
      spark: [0, 1, 1, 0, 2, 2, 2],
      delta: { value: '+1', positive: false },
      variant: 'info',
    },
  ];

  return {
    range,
    kpis,
    topHostCancel: [
      {
        hostName: 'Phạm Hữu Cường',
        propertyCount: 3,
        bookingCount: 42,
        cancelRate: 14.3,
        flag: 'red',
      },
      {
        hostName: 'Vũ Minh Châu',
        propertyCount: 2,
        bookingCount: 38,
        cancelRate: 7.9,
        flag: 'amber',
      },
      {
        hostName: 'Lê Thị Hà',
        propertyCount: 5,
        bookingCount: 86,
        cancelRate: 4.7,
        flag: 'amber',
      },
      {
        hostName: 'Nguyễn Quang Huy',
        propertyCount: 4,
        bookingCount: 74,
        cancelRate: 2.7,
        flag: 'green',
      },
    ],
    recentDisputes: [
      {
        code: 'DSP-2026-05-014',
        openedAt: '2026-05-15',
        propertyName: 'Villa B1716 — View biển Bãi Cháy',
        issue: 'Khách báo phòng không khớp ảnh',
        status: 'investigating',
      },
      {
        code: 'DSP-2026-05-013',
        openedAt: '2026-05-12',
        propertyName: 'Homestay Hòn Gai Sky',
        issue: 'Chủ giữ cọc không trả sau huỷ hợp lệ',
        status: 'open',
      },
      {
        code: 'DSP-2026-05-012',
        openedAt: '2026-05-10',
        propertyName: 'Sunset Cottage Tuần Châu',
        issue: 'Khách phá đồ — yêu cầu trừ deposit',
        status: 'open',
      },
      {
        code: 'DSP-2026-05-011',
        openedAt: '2026-05-08',
        propertyName: 'OceanView Suite Bãi Cháy',
        issue: 'Đôi bên không thống nhất check-out time',
        status: 'investigating',
      },
      {
        code: 'DSP-2026-05-010',
        openedAt: '2026-05-05',
        propertyName: 'Hidden Bay Retreat',
        issue: 'Nghi ngờ fake listing — ảnh stock',
        status: 'open',
      },
    ],
  };
}

function variantToColor(v: RiskKpi['variant']): string {
  switch (v) {
    case 'danger':
      return 'bg-rose-500';
    case 'warning':
      return 'bg-amber-500';
    case 'success':
      return 'bg-emerald-500';
    default:
      return 'bg-navy-700';
  }
}

function Sparkbar({
  values,
  variant,
}: {
  values: number[];
  variant: RiskKpi['variant'];
}) {
  const max = Math.max(...values, 1);
  return (
    <div className="mt-3 flex h-8 items-end gap-1">
      {values.map((v, i) => {
        const h = Math.max(8, Math.round((v / max) * 100));
        return (
          <span
            key={i}
            className={`block w-full rounded-sm ${variantToColor(variant)} opacity-60`}
            style={{ height: `${h}%` }}
          />
        );
      })}
    </div>
  );
}

function statusBadge(status: 'open' | 'investigating' | 'resolved') {
  if (status === 'open') return <Badge variant="danger">Mở</Badge>;
  if (status === 'investigating') return <Badge variant="warning">Đang xử lý</Badge>;
  return <Badge variant="success">Đã xử lý</Badge>;
}

function flagBadge(flag: 'red' | 'amber' | 'green') {
  if (flag === 'red') return <Badge variant="danger">Cao</Badge>;
  if (flag === 'amber') return <Badge variant="warning">Trung bình</Badge>;
  return <Badge variant="success">Thấp</Badge>;
}

export default async function AdminReportsPage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await props.searchParams;
  const range: RangeKey = isRange(sp.range) ? sp.range : 'quarter';
  const data = getMock(range);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Báo cáo & Phân tích"
        description="5 chỉ số rủi ro vận hành cốt lõi theo BUSINESS_RISKS §7. Dữ liệu mock — BE sẽ wire khi expose `/admin/reports/risk-kpis`."
        breadcrumbs={[
          { label: 'Quản trị' },
          { label: 'Báo cáo & Phân tích' },
        ]}
        actions={
          <div className="flex flex-wrap gap-1.5">
            {VALID_RANGES.map((r) => {
              const active = r === range;
              return (
                <Link
                  key={r}
                  href={`/admin/reports?range=${r}`}
                  className={
                    'inline-flex h-9 items-center rounded-[10px] px-3 text-sm font-semibold transition-colors ' +
                    (active
                      ? 'bg-navy-900 text-white'
                      : 'bg-white text-ink-900 ring-1 ring-ink-200 hover:bg-cream-100')
                  }
                >
                  {RANGE_LABEL[r]}
                </Link>
              );
            })}
          </div>
        }
      />

      {/* KPI grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.key}
            className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60"
          >
            <p className="overline muted no-dash text-[10px]">{kpi.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="font-display text-[1.75rem] font-semibold tracking-tight leading-none text-navy-900">
                {kpi.value}
              </p>
              <span
                className={
                  'text-xs font-semibold ' +
                  (kpi.delta.positive ? 'text-emerald-700' : 'text-rose-600')
                }
              >
                {kpi.delta.positive ? '↓' : '↑'} {kpi.delta.value}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-500 leading-snug">{kpi.hint}</p>
            <Sparkbar values={kpi.spark} variant={kpi.variant} />
          </div>
        ))}

        {/* Filler stat to round out 6-cell grid (lg:grid-cols-3) */}
        <StatCard
          label="Booking hoàn tất kỳ này"
          value={range === 'year' ? '4.812' : range === 'quarter' ? '1.184' : range === 'month' ? '342' : '78'}
          hint="So với kỳ trước"
          trend={{ value: '8.4%', positive: true }}
        />
      </div>

      {/* Tables */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
                Top chủ huỷ sau confirmed
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Chủ nhà có tỉ lệ huỷ cao nhất kỳ này.
              </p>
            </div>
            <Badge variant="warning">Cảnh báo</Badge>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ink-500">
                  <th className="px-3 py-2 font-medium">Chủ nhà</th>
                  <th className="px-3 py-2 font-medium">Booking</th>
                  <th className="px-3 py-2 font-medium">Tỉ lệ huỷ</th>
                  <th className="px-3 py-2 font-medium">Mức</th>
                </tr>
              </thead>
              <tbody>
                {data.topHostCancel.map((row) => (
                  <tr
                    key={row.hostName}
                    className="border-t border-ink-100 align-middle"
                  >
                    <td className="px-3 py-3">
                      <p className="font-semibold text-ink-900">
                        {row.hostName}
                      </p>
                      <p className="text-[11px] text-ink-500">
                        {row.propertyCount} cơ sở
                      </p>
                    </td>
                    <td className="px-3 py-3 text-ink-700">
                      {row.bookingCount}
                    </td>
                    <td className="px-3 py-3 font-semibold text-ink-900">
                      {row.cancelRate.toFixed(1)}%
                    </td>
                    <td className="px-3 py-3">{flagBadge(row.flag)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
          <div className="flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
                Dispute gần nhất
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Các khiếu nại đang mở hoặc đang xử lý.
              </p>
            </div>
            <Link
              href="/admin/disputes"
              className="text-sm font-semibold text-navy-900 hover:underline"
            >
              Xem tất cả →
            </Link>
          </div>
          <div className="mt-4 space-y-2">
            {data.recentDisputes.map((d) => (
              <div
                key={d.code}
                className="rounded-xl border border-ink-100 p-3 hover:bg-cream-50"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-mono text-xs font-semibold text-ink-900">
                    {d.code}
                  </p>
                  {statusBadge(d.status)}
                </div>
                <p className="mt-1 text-sm text-ink-900">{d.issue}</p>
                <p className="mt-0.5 text-[11px] text-ink-500">
                  {d.propertyName} · mở {d.openedAt}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

    </div>
  );
}
