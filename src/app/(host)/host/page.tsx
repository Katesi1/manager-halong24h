import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { listBookingsAction } from '@/app/actions/bookings';
import { getDashboardStatsAction } from '@/app/actions/dashboard';
import { listPropertiesAction } from '@/app/actions/properties';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { WelcomeChecklist } from '@/components/host/welcome-checklist';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Booking } from '@/core/entities/booking';
import { RoleCode } from '@/core/value-objects/role';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate, todayISO } from '@/lib/format';

export const metadata: Metadata = { title: 'Tổng quan' };

// Fallback dùng khi API stats fail. Phân biệt số liệu thật = 0 vs
// "chưa tải được": `null` ở trường tiền tệ → formatVND() render "—".
const FALLBACK_STATS = {
  totalRooms: 0,
  activeRooms: 0,
  emptyRooms: 0,
  occupiedRooms: 0,
  globalTotalRooms: 0,
  globalEmptyRooms: 0,
  checkoutToday: 0,
  totalBookings: 0,
  thisMonthBookings: 0,
  monthlyRevenue: null as number | null,
  todayRevenue: null as number | null,
};

function isToday(iso: string): boolean {
  return iso.startsWith(todayISO());
}

function occupancyPct(stats: typeof FALLBACK_STATS): number {
  if (!stats.totalRooms) return 0;
  return Math.round((stats.occupiedRooms / stats.totalRooms) * 100);
}

export default async function HostDashboardPage() {
  const [profile, statsResult, bookingsResult, propertiesResult] =
    await Promise.all([
      getCurrentProfile(),
      getDashboardStatsAction(),
      listBookingsAction(),
      listPropertiesAction({ includeInactive: true }),
    ]);

  const stats = statsResult.ok ? statsResult.data : FALLBACK_STATS;
  const bookings: Booking[] = bookingsResult.ok ? bookingsResult.data : [];
  const properties = propertiesResult.ok ? propertiesResult.data : [];

  const showChecklist = profile && profile.role === RoleCode.OWNER;

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

  const apiError = !statsResult.ok ? statsResult.error : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Tổng quan"
        description="Xin chào! Đây là bức tranh kinh doanh hôm nay."
        actions={
          <>
            <Link href="/host/calendar">
              <Button variant="outline" size="sm">
                Xem lịch
              </Button>
            </Link>
            <Link href="/host/properties/new">
              <Button size="sm">+ Thêm cơ sở</Button>
            </Link>
          </>
        }
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không kết nối được API: </span>
          {apiError}
        </div>
      )}

      {showChecklist && profile && (
        <WelcomeChecklist
          profile={profile}
          propertyCount={properties.length}
          bookingCount={bookings.length}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Doanh thu tháng"
          value={formatVND(stats.monthlyRevenue)}
          hint={`Hôm nay: ${formatVND(stats.todayRevenue)}`}
        />
        <StatCard
          label="Lượt đặt trong tháng"
          value={String(stats.thisMonthBookings)}
          hint={`Lifetime: ${stats.totalBookings}`}
        />
        <StatCard
          label="Tỷ lệ lấp đầy"
          value={`${occupancyPct(stats)}%`}
          hint={`${stats.occupiedRooms}/${stats.totalRooms} phòng có khách`}
        />
        <StatCard
          label="Phòng trống"
          value={`${stats.emptyRooms} / ${stats.activeRooms}`}
          hint={`${stats.checkoutToday} check-out hôm nay`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Việc cần làm hôm nay
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="overline muted no-dash text-[10px]">
                Check-in ({todayCheckins.length})
              </h3>
              <ul className="mt-3 space-y-3">
                {todayCheckins.length === 0 && (
                  <li className="text-sm text-ink-500">
                    Không có khách check-in hôm nay
                  </li>
                )}
                {todayCheckins.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {b.guestName}
                      </p>
                      <p className="text-xs text-ink-500">
                        {b.propertyName} · {b.id}
                      </p>
                    </div>
                    <Link
                      href={`/host/bookings/${b.id}`}
                      className="text-xs font-semibold text-navy-700 hover:underline shrink-0"
                    >
                      Xem →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="overline muted no-dash text-[10px]">
                Check-out ({todayCheckouts.length})
              </h3>
              <ul className="mt-3 space-y-3">
                {todayCheckouts.length === 0 && (
                  <li className="text-sm text-ink-500">
                    Không có khách check-out hôm nay
                  </li>
                )}
                {todayCheckouts.map((b) => (
                  <li
                    key={b.id}
                    className="flex items-start justify-between gap-2"
                  >
                    <div>
                      <p className="text-sm font-semibold text-ink-900">
                        {b.guestName}
                      </p>
                      <p className="text-xs text-ink-500">{b.propertyName}</p>
                    </div>
                    <Link
                      href={`/host/bookings/${b.id}`}
                      className="text-xs font-semibold text-navy-700 hover:underline shrink-0"
                    >
                      Xem →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Đặt phòng đang giữ
            </h2>
            <Badge variant="gold">{holdLeads.length}</Badge>
          </div>
          <ul className="mt-4 space-y-4">
            {holdLeads.length === 0 && (
              <li className="text-sm text-ink-500">Không có booking giữ chỗ</li>
            )}
            {holdLeads.map((l) => (
              <li key={l.id}>
                <Link
                  href={`/host/bookings/${l.id}`}
                  className="block rounded-lg p-3 -mx-3 hover:bg-cream-100"
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
          <Link
            href="/host/bookings?status=hold"
            className="mt-3 block text-center text-sm font-semibold text-navy-700 hover:underline"
          >
            Xem tất cả →
          </Link>
        </section>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
          Đặt phòng sắp tới
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr className="border-b border-ink-200">
                <th className="pb-2 pr-4">Mã</th>
                <th className="pb-2 pr-4">Khách</th>
                <th className="pb-2 pr-4">Nhận phòng</th>
                <th className="pb-2 pr-4 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {upcoming.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-ink-500">
                    Chưa có booking sắp tới
                  </td>
                </tr>
              )}
              {upcoming.map((b) => (
                <tr key={b.id} className="hover:bg-cream-100">
                  <td className="py-3 pr-4 font-mono text-xs text-ink-700">
                    {b.id}
                  </td>
                  <td className="py-3 pr-4 font-medium text-ink-900">
                    {b.guestName}
                  </td>
                  <td className="py-3 pr-4 text-ink-700">
                    {formatDate(b.checkInAt)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <Link
                      href={`/host/bookings/${b.id}`}
                      className="text-xs font-semibold text-navy-700 hover:underline"
                    >
                      Chi tiết →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
