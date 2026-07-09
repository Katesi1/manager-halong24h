'use client';

import Link from 'next/link';

import { BookingStatusRing } from '@/components/host/booking-status-ring';
import { RevenueAreaChart } from '@/components/host/revenue-area-chart';
import {
  RevenueReportExport,
  type ReportData,
} from '@/components/host/revenue-report-export';
import { WelcomeChecklist } from '@/components/host/welcome-checklist';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/core/entities/booking';
import type { DashboardReport } from '@/core/entities/dashboard';
import type { UserProfile } from '@/core/entities/user';
import { RoleCode } from '@/core/value-objects/role';
import { formatVND } from '@/core/value-objects/vnd';
import { formatBookingTotal } from '@/lib/booking-display';
import { formatDate, todayISO } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

type Stats = {
  totalRooms: number;
  activeRooms: number;
  emptyRooms: number;
  occupiedRooms: number;
  globalTotalRooms: number;
  globalEmptyRooms: number;
  checkoutToday: number;
  totalBookings: number;
  thisMonthBookings: number;
  monthlyRevenue: number | null;
  todayRevenue: number | null;
};

type DashProfile = Pick<
  UserProfile,
  'role' | 'name' | 'email' | 'kycStatus' | 'kycBypass'
>;

interface DashboardData {
  profile: DashProfile;
  stats: Stats;
  statsError: string | null;
  bookings: Booking[];
  propertyCount: number;
  report: DashboardReport | null;
}

function isToday(iso: string): boolean {
  return iso.startsWith(todayISO());
}

function occupancyPct(stats: Stats): number {
  if (!stats.totalRooms) return 0;
  return Math.round((stats.occupiedRooms / stats.totalRooms) * 100);
}

/**
 * Dashboard chủ nhà fetch từ `/api/host/dashboard` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Toàn bộ thẻ/chart/bảng render từ dữ liệu fetch được.
 */
export function HostDashboardClient() {
  const { loading, error, data } = useApiResource<DashboardData>(
    '/api/host/dashboard',
  );

  if (loading) {
    return <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Không tải được dữ liệu tổng quan: {error ?? 'Lỗi'}
      </div>
    );
  }

  const { profile, stats, statsError, bookings, propertyCount, report } = data;
  const showChecklist = profile.role === RoleCode.OWNER;

  const todayCheckins = bookings.filter(
    (b) => b.status === 'confirmed' && isToday(b.checkInAt),
  );
  const todayCheckouts = bookings.filter(
    (b) => b.status === 'completed' && isToday(b.checkOutAt),
  );
  const upcoming = bookings
    .filter(
      (b) =>
        (b.status === 'confirmed' || b.status === 'hold') &&
        b.checkInAt > new Date().toISOString(),
    )
    .slice(0, 5);
  const holdLeads = bookings.filter((b) => b.status === 'hold').slice(0, 5);

  const occ = occupancyPct(stats);

  const revenueChart = (report?.revenueByDay ?? []).slice(-30).map((d) => ({
    label: d.date.slice(5),
    value: Number(d.revenue),
    fullDate: d.date,
  }));

  const bookingSegments = [
    { label: 'Xác nhận', value: report?.confirmedCount ?? 0, color: '#1b365d' },
    { label: 'Hoàn tất', value: report?.completedCount ?? 0, color: '#10b981' },
    { label: 'Đang giữ', value: report?.holdCount ?? 0, color: '#c9a96e' },
    { label: 'Đã huỷ', value: report?.cancelledCount ?? 0, color: '#ef4444' },
  ];
  const bookingTotal = bookingSegments.reduce((s, b) => s + b.value, 0);
  const topRooms = (report?.topRooms ?? []).slice(0, 5);

  const now = new Date();
  const monthLabel = `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`;

  const reportData: ReportData | null = report
    ? {
        ownerName: profile.name ?? profile.email ?? 'Chủ nhà',
        periodLabel: monthLabel,
        generatedAt: formatDate(now),
        totalRevenue: Number(report.revenue),
        totalBookings: report.totalBookings,
        adr: Number(report.adr),
        occupancyRate: report.occupancyRate,
        confirmedCount: report.confirmedCount,
        completedCount: report.completedCount,
        holdCount: report.holdCount,
        cancelledCount: report.cancelledCount,
        topRooms: (report.topRooms ?? []).map((r, i) => ({
          rank: i + 1,
          name: r.name,
          bookings: r.bookings,
          occupancy: r.occupancy,
          revenue: Number(r.revenue),
        })),
        revenueByDay: (report.revenueByDay ?? []).map((d) => ({
          date: d.date,
          revenue: Number(d.revenue),
          bookings: d.bookings,
        })),
      }
    : null;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
        {reportData && <RevenueReportExport data={reportData} />}
        <Link href="/host/properties/new">
          <Button size="sm">+ Thêm cơ sở</Button>
        </Link>
      </div>

      {statsError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Tạm thời không tải được dữ liệu: </span>
          {statsError}
        </div>
      )}

      {showChecklist && (
        <WelcomeChecklist
          profile={profile}
          propertyCount={propertyCount}
          bookingCount={bookings.length}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <HeroStat
          accent="navy"
          icon="revenue"
          label="Doanh thu tháng"
          value={formatVND(stats.monthlyRevenue)}
          sub={`Hôm nay: ${formatVND(stats.todayRevenue)}`}
        />
        <HeroStat
          accent="gold"
          icon="booking"
          label="Lượt đặt trong tháng"
          value={String(stats.thisMonthBookings)}
          sub={`Tổng tích luỹ: ${stats.totalBookings}`}
        />
        <HeroStat
          accent="emerald"
          icon="occupancy"
          label="Tỷ lệ lấp đầy"
          value={`${occ}%`}
          sub={`${stats.occupiedRooms}/${stats.totalRooms} phòng có khách`}
          ring={occ}
        />
        <HeroStat
          accent="rose"
          icon="rooms"
          label="Phòng trống"
          value={`${stats.emptyRooms} / ${stats.activeRooms}`}
          sub={`${stats.checkoutToday} check-out hôm nay`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900 mb-4">
            Doanh thu theo ngày
          </h2>
          <RevenueAreaChart data={revenueChart} height={260} />
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card flex flex-col">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Trạng thái booking
          </h2>
          <p className="text-xs text-ink-500 mt-0.5 mb-4">Phân bổ tháng này</p>
          <div className="flex-1 grid place-items-center">
            <BookingStatusRing segments={bookingSegments} total={bookingTotal} />
          </div>
        </section>
      </div>

      {report && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <MiniMetric label="Giá trung bình / đêm" value={formatVND(report.adr)} icon="adr" />
          <MiniMetric label="Doanh thu đã thu" value={formatVND(report.revenue)} icon="deposit" />
          <MiniMetric label="Tỷ lệ Occupancy" value={`${report.occupancyRate.toFixed(1)}%`} icon="occ" />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Top phòng bán chạy
          </h2>
          {topRooms.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">
              Chưa có dữ liệu phòng bán chạy
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-100">
              {topRooms.map((r, i) => (
                <li
                  key={r.roomId}
                  className="flex items-center justify-between py-3.5 hover:bg-cream-50 -mx-3 px-3 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${
                        i < 3
                          ? 'bg-gradient-to-br from-gold-400 to-gold-600'
                          : 'bg-navy-900'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate">
                        {r.name}
                      </p>
                      <p className="text-xs text-ink-500">
                        {r.bookings} booking · {r.occupancy.toFixed(0)}% occupancy
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 font-display text-lg font-semibold text-emerald-700">
                    {formatVND(r.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
              Đặt phòng đang giữ
            </h2>
            <Badge variant="gold">{holdLeads.length}</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {holdLeads.length === 0 && (
              <li className="text-sm text-ink-500">Không có booking giữ chỗ</li>
            )}
            {holdLeads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/host/bookings/${l.id}`}
                  className="block rounded-lg p-3 -mx-3 hover:bg-cream-100 transition-colors"
                >
                  <p className="text-sm font-semibold text-ink-900">
                    {l.guestName}
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">{l.propertyName}</p>
                  <p className="text-xs text-gold-700 mt-1 font-medium">
                    {formatDate(l.checkInAt)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {holdLeads.length > 0 && (
            <Link
              href="/host/bookings?status=hold"
              className="mt-3 block text-center text-sm font-semibold text-navy-700 hover:underline"
            >
              Xem tất cả
            </Link>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Việc cần làm hôm nay
        </h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <TaskList
            title={`Check-in (${todayCheckins.length})`}
            items={todayCheckins}
            emptyText="Không có khách check-in hôm nay"
          />
          <TaskList
            title={`Check-out (${todayCheckouts.length})`}
            items={todayCheckouts}
            emptyText="Không có khách check-out hôm nay"
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Đặt phòng sắp tới
          </h2>
          <Link
            href="/host/bookings"
            className="text-xs font-semibold text-navy-700 hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <tr className="border-b border-ink-200">
                <th className="pb-2.5 pr-4">Mã</th>
                <th className="pb-2.5 pr-4">Khách</th>
                <th className="pb-2.5 pr-4">Cơ sở</th>
                <th className="pb-2.5 pr-4">Nhận phòng</th>
                <th className="pb-2.5 pr-4 text-right">Tổng tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-ink-500">
                    Chưa có booking sắp tới
                  </td>
                </tr>
              )}
              {upcoming.map((b) => (
                <tr key={b.id} className="hover:bg-cream-50 transition-colors">
                  <td className="py-3 pr-4 font-mono text-xs text-ink-500">
                    {b.id.slice(0, 8)}
                  </td>
                  <td className="py-3 pr-4">
                    <Link
                      href={`/host/bookings/${b.id}`}
                      className="font-medium text-ink-900 hover:text-navy-700 hover:underline"
                    >
                      {b.guestName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-ink-700 text-xs">
                    {b.propertyName}
                  </td>
                  <td className="py-3 pr-4 text-ink-700">
                    {formatDate(b.checkInAt)}
                  </td>
                  <td className="py-3 pr-4 text-right font-semibold text-emerald-700">
                    {formatBookingTotal(b.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

/* ─── Sub-components ─── */

const ACCENT_MAP = {
  navy: { border: 'border-l-navy-700', iconBg: 'bg-navy-50', iconColor: 'text-navy-700' },
  gold: { border: 'border-l-gold-500', iconBg: 'bg-gold-50', iconColor: 'text-gold-700' },
  emerald: { border: 'border-l-emerald-500', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-700' },
  rose: { border: 'border-l-rose-400', iconBg: 'bg-rose-50', iconColor: 'text-rose-600' },
} as const;

const ICON_MAP = {
  revenue: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  booking: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  occupancy: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  rooms: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
} as const;

function HeroStat({
  accent,
  icon,
  label,
  value,
  sub,
  ring,
}: {
  accent: keyof typeof ACCENT_MAP;
  icon: keyof typeof ICON_MAP;
  label: string;
  value: string;
  sub: string;
  ring?: number;
}) {
  const a = ACCENT_MAP[accent];
  return (
    <div
      className={`relative rounded-2xl border-l-[3px] bg-white p-5 shadow-card ring-1 ring-ink-200/60 ${a.border}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
          {label}
        </p>
        <div className={`rounded-lg p-1.5 ${a.iconBg} ${a.iconColor}`}>
          {ICON_MAP[icon]}
        </div>
      </div>
      <p className="mt-2 font-display text-[1.75rem] font-semibold tracking-tight leading-none text-navy-900">
        {value}
      </p>
      <p className="mt-1.5 text-xs text-ink-500">{sub}</p>
      {ring != null && (
        <div className="absolute right-5 bottom-5">
          <MiniRing pct={ring} />
        </div>
      )}
    </div>
  );
}

function MiniRing({ pct }: { pct: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r={r} fill="none" stroke="var(--color-ink-200)" strokeWidth="3" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="var(--color-emerald-500)"
        strokeWidth="3"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
    </svg>
  );
}

const MINI_ICON = {
  adr: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </svg>
  ),
  deposit: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  occ: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  ),
} as const;

function MiniMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof MINI_ICON;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3.5 ring-1 ring-ink-200/60 shadow-card">
      <div className="rounded-lg bg-cream-100 p-2 text-navy-700">
        {MINI_ICON[icon]}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500 truncate">
          {label}
        </p>
        <p className="font-display text-lg font-semibold text-navy-900 leading-tight">
          {value}
        </p>
      </div>
    </div>
  );
}

function TaskList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Booking[];
  emptyText: string;
}) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {title}
      </h3>
      <ul className="mt-3 space-y-2.5">
        {items.length === 0 && (
          <li className="text-sm text-ink-500">{emptyText}</li>
        )}
        {items.map((b) => (
          <li
            key={b.id}
            className="flex items-start justify-between gap-2 rounded-lg p-2.5 -mx-2.5 hover:bg-cream-50 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-900 truncate">
                {b.guestName}
              </p>
              <p className="text-xs text-ink-500 truncate">
                {b.propertyName} · {b.id.slice(0, 8)}
              </p>
            </div>
            <Link
              href={`/host/bookings/${b.id}`}
              className="text-xs font-semibold text-navy-700 hover:underline shrink-0 mt-0.5"
            >
              Xem
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
