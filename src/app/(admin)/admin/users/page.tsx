import type { Metadata } from 'next';
import Link from 'next/link';

import { listAdminUsersAction } from '@/app/actions/admin-users';

export const metadata: Metadata = { title: 'Người dùng' };
import { EmptyState } from '@/components/admin/empty-state';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { AdminUser, AdminUserStatus } from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';
import { formatDate, formatRelativeOrDate } from '@/lib/format';

const STATUS_LABEL: Record<AdminUserStatus, string> = {
  active: 'Hoạt động',
  suspended: 'Tạm dừng',
  banned: 'Đã chặn',
};

const STATUS_VARIANT: Record<
  AdminUserStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  active: 'success',
  suspended: 'warning',
  banned: 'danger',
};

const ROLE_VARIANT: Record<
  RoleCode,
  Parameters<typeof Badge>[0]['variant']
> = {
  [RoleCode.ADMIN]: 'dark',
  [RoleCode.OWNER]: 'navy',
  [RoleCode.SALE]: 'info',
  [RoleCode.CUSTOMER]: 'default',
};

const ROLE_LABEL: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: 'Quản trị',
  [RoleCode.OWNER]: 'Chủ nhà',
  [RoleCode.SALE]: 'Nhân viên',
  [RoleCode.CUSTOMER]: 'Khách',
};

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'customer', label: 'Khách' },
  { key: 'owner', label: 'Chủ nhà' },
  { key: 'sale', label: 'Nhân viên' },
  { key: 'admin', label: 'Quản trị' },
];

const ROLE_FROM_TAB: Record<string, RoleCode | undefined> = {
  customer: RoleCode.CUSTOMER,
  owner: RoleCode.OWNER,
  sale: RoleCode.SALE,
  admin: RoleCode.ADMIN,
};

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ role?: string; q?: string; status?: string }>;
}) {
  const sp = await props.searchParams;
  const role = sp.role ? ROLE_FROM_TAB[sp.role] : undefined;
  const status =
    sp.status === 'active' ||
    sp.status === 'suspended' ||
    sp.status === 'banned'
      ? sp.status
      : undefined;
  const result = await listAdminUsersAction({
    role,
    status,
    search: sp.q,
  });
  const users: AdminUser[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Người dùng"
        description="Quản lý tất cả tài khoản: Khách, Chủ nhà, Nhân viên SALE, Quản trị viên. Tìm kiếm, lọc, chặn, drill-down xem hoạt động."
      />

      {apiError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {apiError}
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2 border-b border-ink-200">
          {TABS.map((t) => {
            const active = (sp.role ?? '') === t.key;
            const params = new URLSearchParams();
            if (t.key) params.set('role', t.key);
            if (sp.q) params.set('q', sp.q);
            if (sp.status) params.set('status', sp.status);
            const href =
              '/admin/users' + (params.toString() ? `?${params}` : '');
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  'shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors ' +
                  (active
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-ink-500 hover:text-navy-900')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form
          className="flex items-center gap-2"
          action="/admin/users"
          method="get"
        >
          {sp.role && <input type="hidden" name="role" value={sp.role} />}
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Tìm theo tên, email, SĐT, ID…"
            className="h-10 w-64 rounded-[10px] border border-ink-300 bg-white px-3 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-[10px] bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Tìm
          </button>
        </form>
      </div>

      {apiError ? null : users.length === 0 ? (
        <EmptyState
          icon="👥"
          title="Không có người dùng phù hợp"
          description="Thử bỏ bộ lọc hoặc kiểm tra lại từ khóa tìm kiếm."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left">
              <tr>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Người dùng
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Vai trò
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Liên hệ
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3 text-right">
                  Hoạt động
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Trạng thái
                </th>
                <th className="overline muted no-dash text-[10px] px-4 py-3">
                  Hoạt động gần nhất
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-cream-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-semibold text-ink-900 hover:underline hover:text-navy-900"
                    >
                      {u.name}
                    </Link>
                    <p className="text-[11px] font-mono text-ink-500 mt-0.5">
                      {u.id}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={ROLE_VARIANT[u.role]}>
                      {ROLE_LABEL[u.role]}
                    </Badge>
                    {u.role === RoleCode.SALE && u.ownerId && (
                      <p className="mt-1 text-[10px] text-ink-500">
                        thuộc{' '}
                        <span className="font-mono">
                          {u.ownerId.slice(0, 12)}
                        </span>
                      </p>
                    )}
                    {u.role === RoleCode.OWNER && (
                      <p className="mt-1 flex items-center gap-1 text-[10px]">
                        KYC:{' '}
                        <span
                          className={
                            u.kycStatus === 'approved'
                              ? 'text-emerald-700 font-semibold'
                              : u.kycStatus === 'rejected'
                                ? 'text-rose-700 font-semibold'
                                : u.kycStatus === 'pending'
                                  ? 'text-amber-700 font-semibold'
                                  : 'text-ink-500'
                          }
                        >
                          {u.kycStatus === 'approved'
                            ? '✓ Đã duyệt'
                            : u.kycStatus === 'rejected'
                              ? '✕ Từ chối'
                              : u.kycStatus === 'pending'
                                ? '⏳ Chờ duyệt'
                                : '— Chưa nộp'}
                        </span>
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    <p className="break-all">{u.email}</p>
                    <p className="text-ink-500">{u.phone ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-ink-700">
                    {u.role === RoleCode.OWNER && (
                      <p>
                        <span className="font-semibold text-ink-900">
                          {u.propertyCount}
                        </span>{' '}
                        cơ sở
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-ink-900">
                        {u.bookingCount}
                      </span>{' '}
                      lượt đặt
                    </p>
                    {u.disputeCount > 0 && (
                      <p className="text-rose-600 font-medium">
                        {u.disputeCount} khiếu nại
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[u.status]}>
                      {STATUS_LABEL[u.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">
                    {u.lastActiveAt
                      ? formatRelativeOrDate(u.lastActiveAt)
                      : formatDate(u.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-ink-500">
        Tổng: <strong>{users.length}</strong> người dùng · Mẹo: nhấn vào tên để
        xem chi tiết hoạt động.
      </p>
    </div>
  );
}
