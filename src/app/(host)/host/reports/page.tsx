import Image from 'next/image';

import { getDashboardReportsAction } from '@/app/actions/dashboard';
import { BarChart } from '@/components/host/bar-chart';
import { DonutChart } from '@/components/host/donut-chart';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { ReportToolbar } from '@/components/host/report-toolbar';
import type {
  DashboardReport,
  ReportPeriod,
} from '@/core/entities/dashboard';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate } from '@/lib/format';

const VALID_PERIODS: ReportPeriod[] = ['today', 'week', 'month', 'year', 'custom'];

function isPeriod(p?: string): p is ReportPeriod {
  return !!p && (VALID_PERIODS as string[]).includes(p);
}

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  today: 'Hôm nay',
  week: 'Tuần này',
  month: 'Tháng này',
  year: 'Năm này',
  custom: 'Tuỳ chỉnh',
};

const DOW_LABEL = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const EMPTY_REPORT: DashboardReport = {
  totalRooms: 0,
  activeRooms: 0,
  totalBookings: 0,
  thisMonthBookings: 0,
  holdCount: 0,
  confirmedCount: 0,
  cancelledCount: 0,
  completedCount: 0,
  totalDeposit: 0 as never,
  occupancyRate: 0,
  roomsWithCover: 0,
  roomsWithPrice: 0,
  revenue: 0 as never,
  adr: 0 as never,
  revenueByDay: [],
  topRooms: [],
  previousPeriod: {
    revenue: 0 as never,
    bookings: 0,
    occupancy: 0,
    adr: 0 as never,
  },
  ratingSummary: {
    avgRating: 0,
    totalReviews: 0,
    totalProperties: 0,
    distribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    breakdown: {
      cleanliness: 0,
      location: 0,
      amenities: 0,
      service: 0,
      value: 0,
      accuracy: 0,
    },
  },
  propertyRatings: [],
  recentReviews: [],
  lengthOfStay: { oneNight: 0, twoToThree: 0, fourToSeven: 0, eightPlus: 0 },
  dayOfWeekOccupancy: { values: [0, 0, 0, 0, 0, 0, 0] },
  recentBookings: [],
};

function percentChange(curr: number, prev: number): {
  value: string;
  positive: boolean;
} | undefined {
  if (!prev) return undefined;
  const diff = ((curr - prev) / prev) * 100;
  return { value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`, positive: diff >= 0 };
}

export default async function HostReportsPage(props: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const sp = await props.searchParams;
  const period: ReportPeriod = isPeriod(sp.period) ? sp.period : 'month';

  const result = await getDashboardReportsAction({
    period,
    from: sp.from,
    to: sp.to,
  });

  const report: DashboardReport = result.ok ? result.data : EMPTY_REPORT;
  const apiError = !result.ok ? result.error : null;

  const csvRows = [
    { metric: 'Doanh thu', value: report.revenue },
    { metric: 'Lượt đặt', value: report.totalBookings },
    { metric: 'Giá TB / đêm', value: report.adr },
    { metric: 'Occupancy %', value: report.occupancyRate.toFixed(1) },
    ...report.revenueByDay.map((d) => ({
      metric: `Doanh thu ${d.date}`,
      value: d.revenue,
    })),
    ...report.topRooms.map((r) => ({
      metric: `Top: ${r.name}`,
      value: r.revenue,
    })),
  ];

  const revenueChart = report.revenueByDay.slice(-30).map((d) => ({
    label: d.date.slice(5),
    value: Number(d.revenue),
  }));

  const sourceData = [
    {
      label: 'Đã xác nhận',
      value: report.confirmedCount,
      color: '#1b365d',
    },
    { label: 'Đã hoàn tất', value: report.completedCount, color: '#10b981' },
    { label: 'Đang giữ', value: report.holdCount, color: '#c9a96e' },
    { label: 'Đã huỷ', value: report.cancelledCount, color: '#ef4444' },
  ].filter((d) => d.value > 0);

  const revTrend = percentChange(
    Number(report.revenue),
    Number(report.previousPeriod.revenue),
  );
  const bookingTrend = percentChange(
    report.totalBookings,
    report.previousPeriod.bookings,
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Báo cáo"
        description={`Doanh thu · Occupancy · Top phòng · Reviews — ${PERIOD_LABEL[period]}.`}
        actions={
          <ReportToolbar
            period={period}
            csv={{
              filename: `halong24h-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
              rows: csvRows,
            }}
          />
        }
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được báo cáo: </span>
          {apiError}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Doanh thu"
          value={formatVND(report.revenue)}
          trend={revTrend}
        />
        <StatCard
          label="Lượt đặt"
          value={String(report.totalBookings)}
          trend={bookingTrend}
        />
        <StatCard
          label="Giá TB / đêm"
          value={formatVND(report.adr)}
          
        />
        <StatCard
          label="Occupancy"
          value={`${report.occupancyRate.toFixed(1)}%`}
          hint="Tỷ lệ lấp đầy"
        />
      </div>

      {revenueChart.length > 0 && (
        <section className="mt-8 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Doanh thu theo ngày
          </h2>
          <div className="mt-5">
            <BarChart data={revenueChart} asMoney />
          </div>
        </section>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {sourceData.length > 0 && (
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Trạng thái booking
            </h2>
            <div className="mt-5">
              <DonutChart data={sourceData} />
            </div>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Số đêm trung bình
          </h2>
          <dl className="mt-5 space-y-3">
            <Row
              label="1 đêm"
              value={String(report.lengthOfStay.oneNight)}
              hint="booking"
            />
            <Row
              label="2-3 đêm"
              value={String(report.lengthOfStay.twoToThree)}
              hint="booking"
            />
            <Row
              label="4-7 đêm"
              value={String(report.lengthOfStay.fourToSeven)}
              hint="booking"
            />
            <Row
              label="8+ đêm"
              value={String(report.lengthOfStay.eightPlus)}
              hint="booking"
            />
          </dl>
        </section>
      </div>

      {report.dayOfWeekOccupancy.values.some((v) => v > 0) && (
        <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Occupancy theo ngày trong tuần
          </h2>
          <div className="mt-5 grid grid-cols-7 gap-2">
            {report.dayOfWeekOccupancy.values.map((v, i) => (
              <div key={i} className="text-center">
                <p className="text-xs font-bold uppercase text-ink-500">
                  {DOW_LABEL[i]}
                </p>
                <div className="mt-2 grid place-items-center rounded-lg bg-navy-50 py-3">
                  <span className="text-lg font-bold text-navy-900">
                    {v.toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.topRooms.length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Top phòng bán chạy
          </h2>
          <ul className="mt-4 divide-y divide-ink-200">
            {report.topRooms.map((r, i) => (
              <li key={r.roomId} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-navy-900 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-ink-900">{r.name}</p>
                    <p className="text-xs text-ink-500">
                      {r.bookings} booking · {r.occupancy.toFixed(0)}% occupancy
                    </p>
                  </div>
                </div>
                <span className="font-semibold text-emerald-700">
                  {formatVND(r.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.ratingSummary.totalReviews > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Đánh giá khách hàng
          </h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-4xl font-bold text-gold-600">
                {report.ratingSummary.avgRating.toFixed(1)}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                ⭐ trung bình · {report.ratingSummary.totalReviews} reviews
              </p>
              <dl className="mt-4 space-y-2 text-sm">
                {Object.entries(report.ratingSummary.breakdown).map(
                  ([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between"
                    >
                      <dt className="text-ink-700 capitalize">{k}</dt>
                      <dd className="font-semibold text-ink-900">
                        {v.toFixed(1)} / 5
                      </dd>
                    </div>
                  ),
                )}
              </dl>
            </div>
            {report.recentReviews.length > 0 && (
              <div>
                <h3 className="overline muted no-dash text-[10px]">
                  Review mới nhất
                </h3>
                <ul className="mt-3 space-y-3">
                  {report.recentReviews.slice(0, 3).map((rv) => (
                    <li
                      key={rv.id}
                      className="rounded-lg bg-cream-100 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rv.customerAvatar && (
                            <Image
                              src={rv.customerAvatar}
                              alt={rv.customerName}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          )}
                          <span className="font-medium text-ink-900">
                            {rv.customerName}
                          </span>
                        </div>
                        <span className="text-xs text-ink-500">
                          {formatDate(rv.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1 text-ink-700 line-clamp-2">
                        {rv.comment}
                      </p>
                      <p className="mt-0.5 text-xs text-gold-600">
                        {'⭐'.repeat(rv.rating)}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {report.totalBookings === 0 && !apiError && (
        <div className="mt-8 rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">📊</p>
          <p className="mt-3 font-medium text-ink-900">
            Chưa có dữ liệu cho {PERIOD_LABEL[period].toLowerCase()}.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Đợi khách đặt phòng để có báo cáo.
          </p>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-ink-200 pb-2 last:border-0">
      <div>
        <dt className="text-sm text-ink-700">{label}</dt>
      </div>
      <dd className="font-semibold text-ink-900">
        {value}
        {hint && <span className="ml-1 text-xs font-normal text-ink-500">{hint}</span>}
      </dd>
    </div>
  );
}
