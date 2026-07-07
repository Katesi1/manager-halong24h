'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  BedDouble,
  Building2,
  Calendar,
  CreditCard,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
  UserCog,
} from 'lucide-react';

import { KycBypassToggle } from '@/components/admin/kyc-bypass-toggle';
import { UserModerationActions } from '@/components/admin/user-moderation-actions';
import { UserRoleEditor } from '@/components/admin/user-role-editor';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminUser, AdminUserStatus } from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';
import { formatDateTime, relativeTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  active: 'Đang hoạt động',
  suspended: 'Tạm dừng',
  banned: 'Đã bị chặn',
};

const STATUS_VARIANT: Record<
  AdminUserStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  active: 'success',
  suspended: 'warning',
  banned: 'danger',
};

const ROLE_LABEL: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: 'Quản trị viên',
  [RoleCode.OWNER]: 'Chủ nhà',
  [RoleCode.SALE]: 'Nhân viên SALE',
  [RoleCode.CUSTOMER]: 'Khách hàng',
};

/**
 * Chi tiết người dùng fetch từ `/api/admin/users/:id` PHÍA CLIENT → endpoint
 * hiện trong F12 Network. Loading/error/not-found ở client.
 */
export function AdminUserDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<AdminUser>(
    `/api/admin/users/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy người dùng'}
      </div>
    );
  }

  const user = data;
  const isOwner = user.role === RoleCode.OWNER;
  const isSale = user.role === RoleCode.SALE;
  const isCustomer = user.role === RoleCode.CUSTOMER;

  return (
    <>
      <Link
        href="/admin/users"
        className="group mb-6 inline-flex items-center gap-2 text-sm text-ink-500 transition-colors hover:text-navy-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Quay lại danh sách người dùng
      </Link>

      <div className="mb-6 rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cream-200 text-lg font-bold text-navy-800 uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                  {user.name}
                </h1>
                <Badge variant={STATUS_VARIANT[user.status]}>
                  {STATUS_LABEL[user.status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-ink-500">
                {ROLE_LABEL[user.role]} · Tham gia{' '}
                {formatDateTime(user.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <div className="border-b border-ink-100 px-6 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
                <User className="h-5 w-5 text-ink-400" />
                Thông tin cá nhân
              </h2>
            </div>
            <div className="grid gap-px bg-ink-100 sm:grid-cols-2">
              <InfoCell icon={<User className="h-4 w-4" />} label="Họ tên" value={user.name} />
              <InfoCell icon={<Mail className="h-4 w-4" />} label="Email" value={user.email?.trim() || '—'} mono />
              <InfoCell icon={<Phone className="h-4 w-4" />} label="Số điện thoại" value={user.phone ?? '—'} />
              <InfoCell
                icon={<Calendar className="h-4 w-4" />}
                label="Hoạt động lần cuối"
                value={
                  user.lastActiveAt ? (
                    relativeTime(user.lastActiveAt)
                  ) : (
                    <span className="text-ink-400">Chưa ghi nhận</span>
                  )
                }
              />
              <InfoCell icon={<UserCog className="h-4 w-4" />} label="Mã người dùng" value={user.id} mono />
              <InfoCell
                icon={<UserCog className="h-4 w-4" />}
                label="Vai trò"
                value={
                  <UserRoleEditor
                    userId={user.id}
                    userName={user.name}
                    initialRole={user.role}
                  />
                }
              />
              {isSale && (
                <InfoCell
                  icon={<User className="h-4 w-4" />}
                  label="Thuộc Chủ nhà"
                  value={
                    user.ownerId ? (
                      <Link
                        href={`/admin/users/${user.ownerId}`}
                        className="font-mono text-navy-700 hover:underline"
                      >
                        {user.ownerId}
                      </Link>
                    ) : (
                      <span className="text-amber-700">Chưa được gán</span>
                    )
                  }
                />
              )}
            </div>
          </section>

          {isOwner && (
            <section className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
              <div className="border-b border-ink-100 px-6 py-4">
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
                  <ShieldCheck className="h-5 w-5 text-ink-400" />
                  Xác minh KYC & Gói cước
                </h2>
              </div>
              <div className="grid gap-px bg-ink-100 sm:grid-cols-2">
                <InfoCell
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Trạng thái KYC"
                  value={<KycPill status={user.kycStatus} />}
                />
                <InfoCell
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Gói cước hiện tại"
                  value={
                    user.subscriptionPlan ? (
                      <span className="font-semibold text-navy-900">
                        {planLabel(user.subscriptionPlan)}
                      </span>
                    ) : (
                      '—'
                    )
                  }
                />
                <InfoCell
                  icon={<ShieldCheck className="h-4 w-4" />}
                  label="Quyền bỏ qua KYC"
                  value={
                    <KycBypassToggle userId={user.id} kycBypass={user.kycBypass} />
                  }
                />
              </div>
              {user.kycStatus === 'pending' && (
                <div className="px-6 py-4">
                  <Link href={`/admin/kyc?q=${user.id}`}>
                    <Button variant="outline" size="sm">
                      → Vào trang duyệt KYC
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          )}

          <section className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <div className="border-b border-ink-100 px-6 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-navy-900">
                <BedDouble className="h-5 w-5 text-ink-400" />
                Thống kê hoạt động
              </h2>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-3">
              {isOwner && (
                <StatCard
                  icon={<Building2 className="h-5 w-5 text-navy-600" />}
                  label="Cơ sở sở hữu"
                  value={user.propertyCount}
                  href={`/admin/properties?ownerId=${user.id}`}
                />
              )}
              <StatCard
                icon={<BedDouble className="h-5 w-5 text-emerald-600" />}
                label={isCustomer ? 'Lượt đặt phòng' : 'Đặt phòng đã xử lý'}
                value={user.bookingCount}
                href={`/admin/bookings?${isOwner ? 'ownerId' : isSale ? 'saleId' : 'customerId'}=${user.id}`}
              />
              <StatCard
                icon={<MessageSquare className="h-5 w-5 text-rose-500" />}
                label="Khiếu nại liên quan"
                value={user.disputeCount}
                tone={user.disputeCount > 0 ? 'warning' : 'default'}
                href={`/admin/disputes?userId=${user.id}`}
              />
            </div>
          </section>
        </div>

        <aside>
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Hành động kiểm duyệt
              </p>
              <div className="mt-3">
                <UserModerationActions
                  userId={user.id}
                  role={user.role}
                  status={user.status}
                  subscriptionPlan={user.subscriptionPlan}
                />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}

function InfoCell({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 bg-white px-6 py-4">
      <span className="mt-0.5 shrink-0 text-ink-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-ink-400">{label}</p>
        <p
          className={`mt-0.5 text-sm text-ink-900 ${mono ? 'font-mono break-all' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = 'default',
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: 'default' | 'warning';
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl bg-cream-50 p-4 ring-1 ring-ink-100 transition-all hover:ring-navy-300 hover:shadow-md"
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium text-ink-500">{label}</p>
      </div>
      <p
        className={`mt-2 font-display text-3xl font-semibold tracking-tight ${
          tone === 'warning' && value > 0 ? 'text-rose-700' : 'text-navy-900'
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-400 group-hover:text-navy-700">
        Xem chi tiết →
      </p>
    </Link>
  );
}

function KycPill({
  status,
}: {
  status: 'none' | 'pending' | 'approved' | 'rejected';
}) {
  const cls: Record<typeof status, string> = {
    none: 'bg-cream-200 text-ink-700',
    pending: 'bg-amber-100 text-amber-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-rose-100 text-rose-700',
  };
  const label: Record<typeof status, string> = {
    none: 'Chưa nộp',
    pending: 'Đang chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Bị từ chối',
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${cls[status]}`}
    >
      {label[status]}
    </span>
  );
}

function planLabel(plan: 'free' | 'basic' | 'standard' | 'pro'): string {
  return {
    free: 'Miễn phí',
    basic: 'Cơ bản',
    standard: 'Tiêu chuẩn',
    pro: 'Chuyên nghiệp',
  }[plan];
}
