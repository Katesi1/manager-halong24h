'use client';

import Link from 'next/link';

import { RevenueBarChart } from '@/components/admin/revenue-bar-chart';
import { UserRoleDonut } from '@/components/admin/user-role-donut';
import { StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { VND } from '@/core/value-objects/vnd';
import { formatVND } from '@/core/value-objects/vnd';
import { formatBookingTotal } from '@/lib/booking-display';
import { formatDate } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

interface DashboardData {
  monthlySubscriptionRevenue: number;
  subscriptionRevenue6m: { month: string; revenue: number }[];
  thisMonthBookings: number;
  totalBookings: number;
  totalOwners: number;
  totalCustomers: number;
  totalSales: number;
  bannedUsers: number;
  propertyCount: number;
  activePropertyCount: number;
  pendingPropertiesCount: number;
  kycPendingCount: number;
  activeDisputes: number;
  topProperties: {
    id: string;
    name: string;
    ownerId: string;
    code: string;
    address: string | null;
  }[];
  recentBookings: {
    id: string;
    guestName: string;
    propertyName: string;
    createdAt: string;
    totalPrice: VND | null;
  }[];
}

/**
 * Tổng quan hệ thống fetch từ `/api/admin/dashboard` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Alert/stat cards + charts + lists.
 */
export function AdminDashboardClient() {
  const { loading, error, data } = useApiResource<DashboardData>(
    '/api/admin/dashboard',
  );

  if (loading) {
    return <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Không tải được tổng quan: {error ?? 'Lỗi'}
      </div>
    );
  }

  const d = data;

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AlertCard
          icon="🛡️"
          label="KYC chờ duyệt"
          value={d.kycPendingCount}
          tone={d.kycPendingCount > 0 ? 'warning' : 'ok'}
          href="/admin/kyc?status=awaiting_approval"
        />
        <AlertCard
          icon="🏨"
          label="Cơ sở chờ duyệt"
          value={d.pendingPropertiesCount}
          tone={d.pendingPropertiesCount > 0 ? 'warning' : 'ok'}
          href="/admin/properties?status=pending"
        />
        <AlertCard
          icon="⚠️"
          label="Khiếu nại đang mở"
          value={d.activeDisputes}
          tone={d.activeDisputes > 0 ? 'warning' : 'ok'}
          href="/admin/disputes?status=open"
        />
        <AlertCard
          icon="🚫"
          label="Người dùng bị chặn"
          value={d.bannedUsers}
          tone="default"
          href="/admin/users?status=banned"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Doanh thu hệ thống (subscription)"
          value={formatVND(d.monthlySubscriptionRevenue)}
          hint="Đã thu tháng này"
        />
        <StatCard
          label="Lượt đặt phòng tháng"
          value={String(d.thisMonthBookings)}
          hint={`Tổng tích luỹ: ${d.totalBookings.toLocaleString('vi-VN')}`}
        />
        <StatCard
          label="Chủ nhà / Khách / Nhân viên"
          value={`${d.totalOwners} / ${d.totalCustomers} / ${d.totalSales}`}
          hint="Tổng người dùng theo vai trò"
        />
        <StatCard
          label="Cơ sở toàn hệ thống"
          value={String(d.propertyCount)}
          hint={`${d.activePropertyCount} đang hoạt động`}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
            Doanh thu subscription 6 tháng
          </h2>
          <p className="mt-1 text-xs text-ink-500">Đơn vị: triệu VNĐ</p>
          <div className="mt-5">
            {d.subscriptionRevenue6m.some((m) => m.revenue > 0) ? (
              <RevenueBarChart data={d.subscriptionRevenue6m} />
            ) : (
              <p className="py-8 text-center text-sm text-ink-500">
                Chưa có doanh thu subscription trong 6 tháng gần đây.
              </p>
            )}
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
                { label: 'Chủ nhà (Owner)', value: d.totalOwners, color: '#1e3a5f' },
                { label: 'Nhân viên (Sale)', value: d.totalSales, color: '#c9973f' },
                { label: 'Khách hàng', value: d.totalCustomers, color: '#94a3b8' },
                { label: 'Bị chặn', value: d.bannedUsers, color: '#e11d48' },
              ]}
            />
          </div>
        </section>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Cơ sở mới nhất
            </h2>
            <Badge variant="gold">{d.propertyCount}</Badge>
          </div>
          <ul className="mt-4 space-y-3">
            {d.topProperties.length === 0 && (
              <li className="text-sm text-ink-500">Không có cơ sở</li>
            )}
            {d.topProperties.map((p) => (
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
            {d.recentBookings.length === 0 && (
              <li className="text-sm text-ink-500">Chưa có đặt phòng</li>
            )}
            {d.recentBookings.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2">
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
    </>
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
  const valueClass: Record<typeof tone, string> = {
    ok: 'text-ink-900',
    warning: 'text-amber-800',
    danger: 'text-rose-700',
    default: 'text-ink-900',
  };
  return (
    <Link
      href={href}
      className="block rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:shadow-card-hover transition-all"
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
