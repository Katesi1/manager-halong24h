import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Users } from 'lucide-react';

import { listAdminUsersAction } from '@/app/actions/admin-users';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import type { AdminUser, AdminUserStatus } from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';

export const metadata: Metadata = { title: 'Người dùng' };

const PAGE_SIZE = 10;

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
];

const ROLE_FROM_TAB: Record<string, RoleCode | undefined> = {
  customer: RoleCode.CUSTOMER,
  owner: RoleCode.OWNER,
  sale: RoleCode.SALE,
  admin: RoleCode.ADMIN,
};

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function AdminUsersPage(props: {
  searchParams: Promise<{ role?: string; q?: string; status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const role = sp.role ? ROLE_FROM_TAB[sp.role] : undefined;
  const status =
    sp.status === 'active' ||
    sp.status === 'suspended' ||
    sp.status === 'banned'
      ? sp.status
      : undefined;
  const result = await listAdminUsersAction({ role, status, search: sp.q });
  const allUsers: AdminUser[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const totalPages = Math.ceil(allUsers.length / PAGE_SIZE);
  const paginated = allUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function pageHref(page: number) {
    return buildHref('/admin/users', {
      role: sp.role,
      q: sp.q,
      status: sp.status,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Người dùng"
        description="Quản lý tất cả tài khoản: Khách, Chủ nhà, Nhân viên SALE, Quản trị viên. Tìm kiếm, lọc, chặn, drill-down xem hoạt động."
      />

      {apiError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          {apiError}
        </div>
      )}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = (sp.role ?? '') === t.key;
            const href = buildHref('/admin/users', {
              role: t.key || undefined,
              q: sp.q,
              status: sp.status,
            });
            return (
              <Link
                key={t.key}
                href={href}
                className={
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form
          action="/admin/users"
          method="get"
          className="relative max-w-xs w-full sm:w-auto"
        >
          {sp.role && <input type="hidden" name="role" value={sp.role} />}
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q}
            placeholder="Tìm tên, email, SĐT, ID…"
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {apiError ? null : allUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Users className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Không có người dùng phù hợp
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Thử bỏ bộ lọc hoặc kiểm tra lại từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-cream-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Người dùng
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Vai trò
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Liên hệ
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Hoạt động
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {paginated.map((u) => (
                  <UserRow key={u.id} user={u} />
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allUsers.length}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </div>
  );
}

function UserRow({ user: u }: { user: AdminUser }) {
  return (
    <tr className="transition-colors hover:bg-cream-50">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream-200 text-xs font-bold text-navy-800 uppercase">
            {u.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <Link
              href={`/admin/users/${u.id}`}
              className="font-semibold text-ink-900 hover:text-navy-900 hover:underline"
            >
              {u.name}
            </Link>
            <p className="text-[11px] font-mono text-ink-400 truncate">
              {u.id}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge variant={ROLE_VARIANT[u.role]}>
          {ROLE_LABEL[u.role]}
        </Badge>
        {u.role === RoleCode.OWNER && (
          <p className="mt-1.5 flex items-center gap-1 text-[11px]">
            <KycIndicator status={u.kycStatus} />
          </p>
        )}
        {u.role === RoleCode.SALE && u.ownerId && (
          <p className="mt-1 text-[10px] text-ink-400">
            thuộc <span className="font-mono">{u.ownerId.slice(0, 10)}…</span>
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <p className="text-ink-800 truncate max-w-[200px]">{u.email}</p>
        <p className="text-xs text-ink-400">{u.phone ?? '—'}</p>
      </td>
      <td className="px-5 py-4 text-right text-xs text-ink-700">
        {u.role === RoleCode.OWNER && (
          <p>
            <span className="font-semibold text-ink-900">{u.propertyCount}</span>{' '}
            cơ sở
          </p>
        )}
        <p>
          <span className="font-semibold text-ink-900">{u.bookingCount}</span>{' '}
          lượt đặt
        </p>
        {u.disputeCount > 0 && (
          <p className="font-medium text-rose-600">
            {u.disputeCount} khiếu nại
          </p>
        )}
      </td>
      <td className="px-5 py-4">
        <Badge variant={STATUS_VARIANT[u.status]}>
          {STATUS_LABEL[u.status]}
        </Badge>
      </td>
    </tr>
  );
}

function KycIndicator({
  status,
}: {
  status: 'none' | 'pending' | 'approved' | 'rejected';
}) {
  const config = {
    none: { label: 'KYC: Chưa nộp', cls: 'text-ink-400' },
    pending: { label: 'KYC: Chờ duyệt', cls: 'text-amber-700 font-semibold' },
    approved: { label: 'KYC: ✓ Đã duyệt', cls: 'text-emerald-700 font-semibold' },
    rejected: { label: 'KYC: ✕ Từ chối', cls: 'text-rose-700 font-semibold' },
  }[status];

  return <span className={config.cls}>{config.label}</span>;
}
