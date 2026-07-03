import type { Metadata } from 'next';
import Link from 'next/link';

import { listAdminUsersAction } from '@/app/actions/admin-users';

export const metadata: Metadata = { title: 'Quản trị' };
import { listBookingsAction } from '@/app/actions/bookings';
import { getDashboardStatsAction } from '@/app/actions/dashboard';
import { countActiveDisputesAction } from '@/app/actions/disputes';
import { countPendingKycAdminAction } from '@/app/actions/kyc-admin';
import { listPropertiesAction } from '@/app/actions/properties';
import { sumPaidSubscriptionsAction } from '@/app/actions/subscriptions';
import { RevenueBarChart } from '@/components/admin/revenue-bar-chart';
import { UserRoleDonut } from '@/components/admin/user-role-donut';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/core/entities/booking';
import type { Property } from '@/core/entities/property';
import { RoleCode } from '@/core/value-objects/role';
import { formatVND } from '@/core/value-objects/vnd';
import { formatBookingTotal } from '@/lib/booking-display';
import { formatDate } from '@/lib/format';

const FALLBACK_STATS = {
  totalRooms: 0,
  globalTotalRooms: 0,
  globalEmptyRooms: 0,
  totalBookings: 0,
  thisMonthBookings: 0,
  monthlyRevenue: 0,
  todayRevenue: 0,
};

function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function AdminOverviewPage() {
  const { from, to } = currentMonthRange();
  const [
    statsResult,
    propertiesResult,
    bookingsResult,
    kycCountResult,
    usersResult,
    activeDisputesResult,
    monthlyPaidResult,
  ] = await Promise.all([
    getDashboardStatsAction(),
    listPropertiesAction({ includeInactive: true }),
    listBookingsAction(),
    countPendingKycAdminAction(),
    listAdminUsersAction(),
    countActiveDisputesAction(),
    sumPaidSubscriptionsAction(from, to),
  ]);

  const stats = statsResult.ok ? statsResult.data : FALLBACK_STATS;
  const properties: Property[] = propertiesResult.ok ? propertiesResult.data : [];
  const bookings: Booking[] = bookingsResult.ok ? bookingsResult.data : [];
  const kycPendingCount = kycCountResult.ok ? kycCountResult.data : 0;
  const users = usersResult.ok ? usersResult.data : [];
  const activeDisputes = activeDisputesResult.ok ? activeDisputesResult.data : 0;
  const monthlySubscriptionRevenue = monthlyPaidResult.ok
    ? monthlyPaidResult.data
    : 0;

  const pendingProperties = properties.filter(
    (p) => p.moderationStatus === 'pending',
  );
  const totalOwners = users.filter((u) => u.role === RoleCode.OWNER).length;
  const totalCustomers = users.filter((u) => u.role === RoleCode.CUSTOMER).length;
  const totalSales = users.filter((u) => u.role === RoleCode.SALE).length;
  const bannedUsers = users.filter((u) => u.status === 'banned').length;
  const recentBookings = bookings.slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Tổng quan hệ thống"
        description="Bức tranh toàn Halong24h — chỉ số vận hành, cảnh báo cần action, tài chính theo subscription chủ nhà."
      />

      {/* Alerts cards */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AlertCard
          icon="🛡️"
          label="KYC chờ duyệt"
          value={kycPendingCount}
          tone={kycPendingCount > 0 ? 'warning' : 'ok'}
          href="/admin/kyc?status=awaiting_approval"
        />
        <AlertCard
          icon="🏨"
          label="Cơ sở chờ duyệt"
          value={pendingProperties.length}
          tone={pendingProperties.length > 0 ? 'warning' : 'ok'}
          href="/admin/properties?status=pending"
        />
        <AlertCard
          icon="⚠️"
          label="Khiếu nại đang mở"
          value={activeDisputes}
          tone={activeDisputes > 0 ? 'warning' : 'ok'}
          href="/admin/disputes?status=open"
        />
        <AlertCard
          icon="🚫"
          label="Người dùng bị chặn"
          value={bannedUsers}
          tone="default"
          href="/admin/users?status=banned"
        />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Doanh thu hệ thống (subscription)"
          value={formatVND(monthlySubscriptionRevenue)}
          hint="Đã thu tháng này"
        />
        <StatCard
          label="Lượt đặt phòng tháng"
          value={String(stats.thisMonthBookings)}
          hint={`Tổng tích luỹ: ${stats.totalBookings.toLocaleString('vi-VN')}`}
        />
        <StatCard
          label="Chủ nhà / Khách / Nhân viên"
          value={`${totalOwners} / ${totalCustomers} / ${totalSales}`}
          hint="Tổng người dùng theo vai trò"
        />
        <StatCard
          label="Cơ sở toàn hệ thống"
          value={String(properties.length)}
          hint={`${properties.filter((p) => p.isActive).length} đang hoạt động`}
        />
      </div>

      {/* Charts */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Doanh thu subscription 6 tháng
          </h2>
          <p className="mt-1 text-xs text-ink-500">Đơn vị: triệu VNĐ</p>
          <div className="mt-5">
            <RevenueBarChart
              data={[
                { month: 'T12', revenue: 8_200_000 },
                { month: 'T1', revenue: 9_500_000 },
                { month: 'T2', revenue: 11_800_000 },
                { month: 'T3', revenue: 12_400_000 },
                { month: 'T4', revenue: 13_600_000 },
                { month: 'T5', revenue: 15_900_000 },
              ]}
            />
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Phân bổ người dùng
          </h2>
          <p className="mt-1 text-xs text-ink-500">Theo vai trò hiện tại</p>
          <div className="mt-5 flex justify-center">
            <UserRoleDonut
              segments={[
                { label: 'Chủ nhà (Owner)', value: totalOwners, color: '#1e3a5f' },
                { label: 'Nhân viên (Sale)', value: totalSales, color: '#c9973f' },
                { label: 'Khách hàng', value: totalCustomers, color: '#94a3b8' },
                { label: 'Bị chặn', value: bannedUsers, color: '#e11d48' },
              ]}
            />
          </div>
        </section>
      </div>

      {/* Lists */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Cơ sở mới nhất
            </h2>
            <Badge variant="gold">{properties.length}</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {properties.length === 0 && (
              <li className="text-sm text-ink-500">Không có cơ sở</li>
            )}
            {properties.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/properties/${p.id}`}
                  className="block rounded-lg p-3 -mx-3 hover:bg-cream-100"
                >
                  <p className="text-sm font-semibold text-ink-900">{p.name}</p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Chủ sở hữu: {p.ownerId.slice(0, 12)}…
                  </p>
                  <p className="text-xs text-ink-500 mt-0.5">
                    {p.code} · {p.address ?? 'Hạ Long'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Đặt phòng gần đây
          </h2>
          <ul className="mt-4 space-y-3">
            {recentBookings.length === 0 && (
              <li className="text-sm text-ink-500">Chưa có đặt phòng</li>
            )}
            {recentBookings.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900 truncate">
                    {b.guestName}
                  </p>
                  <p className="text-xs text-ink-500 truncate">
                    {b.propertyName} · {formatDate(b.createdAt)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-700 shrink-0">
                  {formatBookingTotal(b.totalPrice)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function AlertCard({
  icon,
  label,
  value,
  tone,
  href,
  hint,
}: {
  icon: string;
  label: string;
  value: number;
  tone: 'ok' | 'warning' | 'danger' | 'default';
  href: string;
  hint?: string;
}) {
  const toneClass: Record<typeof tone, string> = {
    ok: 'bg-white ring-ink-200/60',
    warning: 'bg-white ring-ink-200/60',
    danger: 'bg-white ring-ink-200/60',
    default: 'bg-white ring-ink-200/60',
  };
  const valueClass: Record<typeof tone, string> = {
    ok: 'text-ink-900',
    warning: 'text-amber-800',
    danger: 'text-rose-700',
    default: 'text-ink-900',
  };
  return (
    <Link
      href={href}
      className={`block rounded-2xl p-5 ring-1 shadow-card hover:shadow-card-hover transition-all ${toneClass[tone]}`}
    >
      <div className="flex items-start justify-between">
        <p className="overline muted no-dash text-[10px]">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <p
        className={`mt-2 font-display text-3xl font-semibold tracking-tight ${valueClass[tone]}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-ink-500">{hint}</p>}
    </Link>
  );
}
