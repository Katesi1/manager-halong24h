import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getAdminUserAction } from '@/app/actions/admin-users';
import { UserModerationActions } from '@/components/admin/user-moderation-actions';
import { UserRoleEditor } from '@/components/admin/user-role-editor';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AdminUserStatus } from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';
import { formatDateTime, relativeTime } from '@/lib/format';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getAdminUserAction(id);
  if (result.ok && result.data) {
    return { title: `${result.data.name} · Người dùng` };
  }
  return { title: 'Chi tiết người dùng' };
}

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

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const result = await getAdminUserAction(id);
  if (!result.ok || result.data === null) notFound();
  const user = result.data;

  const isOwner = user.role === RoleCode.OWNER;
  const isSale = user.role === RoleCode.SALE;
  const isCustomer = user.role === RoleCode.CUSTOMER;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow={ROLE_LABEL[user.role]}
        title={user.name}
        description={`Mã: ${user.id} · Tham gia ${formatDateTime(user.createdAt)}`}
        breadcrumbs={[
          { label: 'Người dùng', href: '/admin/users' },
          { label: user.name },
        ]}
        actions={
          <Badge variant={STATUS_VARIANT[user.status]}>
            {STATUS_LABEL[user.status]}
          </Badge>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Profile */}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Thông tin tài khoản
            </h2>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="Email" value={user.email} mono />
              <Field label="Số điện thoại" value={user.phone ?? '—'} />
              <Field
                label="Hoạt động gần nhất"
                value={
                  user.lastActiveAt
                    ? `${relativeTime(user.lastActiveAt)} (${formatDateTime(user.lastActiveAt)})`
                    : '—'
                }
              />
              <Field
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
                <Field
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
                      <span className="text-amber-700">— Chưa được gán</span>
                    )
                  }
                />
              )}
            </dl>
          </section>

          {/* Owner-specific: KYC + Subscription */}
          {isOwner && (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Xác minh & Gói cước
              </h2>
              <dl className="mt-4 grid gap-3 md:grid-cols-2">
                <Field
                  label="Trạng thái KYC"
                  value={
                    <KycPill status={user.kycStatus} />
                  }
                />
                <Field
                  label="Gói cước"
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
              </dl>
              {user.kycStatus === 'pending' && (
                <Link href={`/admin/kyc?q=${user.id}`} className="mt-4 inline-block">
                  <Button variant="outline" size="sm">
                    → Vào trang duyệt KYC
                  </Button>
                </Link>
              )}
            </section>
          )}

          {/* Activity drill-down */}
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Hoạt động
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {isOwner && (
                <StatBox
                  label="Cơ sở sở hữu"
                  value={user.propertyCount}
                  href={`/admin/properties?ownerId=${user.id}`}
                />
              )}
              <StatBox
                label={isCustomer ? 'Lượt đặt phòng' : 'Đặt phòng đã làm'}
                value={user.bookingCount}
                href={`/admin/bookings?${isOwner ? 'ownerId' : isSale ? 'saleId' : 'customerId'}=${user.id}`}
              />
              <StatBox
                label="Khiếu nại liên quan"
                value={user.disputeCount}
                tone={user.disputeCount > 0 ? 'warning' : 'default'}
                href={`/admin/disputes?userId=${user.id}`}
              />
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <p className="overline muted no-dash text-[10px]">
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
    </div>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="overline muted no-dash text-[10px]">{label}</dt>
      <dd
        className={`mt-1 text-sm text-ink-900 ${mono ? 'font-mono break-all' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

function StatBox({
  label,
  value,
  tone = 'default',
  href,
}: {
  label: string;
  value: number;
  tone?: 'default' | 'warning';
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl bg-cream-100 p-4 hover:bg-cream-200 transition-colors"
    >
      <p className="overline muted no-dash text-[10px]">{label}</p>
      <p
        className={`mt-2 font-display text-2xl font-semibold ${tone === 'warning' && value > 0 ? 'text-rose-700' : 'text-navy-900'}`}
      >
        {value}
      </p>
      <p className="mt-1 text-[11px] text-ink-500">→ Xem chi tiết</p>
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
