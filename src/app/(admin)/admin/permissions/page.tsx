import { Fragment } from 'react';

import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { RoleCode } from '@/core/value-objects/role';

/**
 * Ma trận RBAC hiển thị-only.
 *
 * Hiện RBAC HARD-CODE trong code (xem `src/core/value-objects/role.ts` +
 * các guard rải rác). Trang này CHỈ hiển thị mapping cho admin reference —
 * KHÔNG persist. Sửa quyền vẫn cần đi qua code review + deploy.
 */

type Role = 'ADMIN' | 'OWNER' | 'SALE' | 'CUSTOMER';

const ROLES: Role[] = ['ADMIN', 'OWNER', 'SALE', 'CUSTOMER'];

const ROLE_META: Record<Role, { label: string; hint: string; code: number }> = {
  ADMIN: {
    label: 'ADMIN',
    hint: 'Quản trị viên hệ thống',
    code: RoleCode.ADMIN,
  },
  OWNER: {
    label: 'OWNER',
    hint: 'Chủ cơ sở',
    code: RoleCode.OWNER,
  },
  SALE: {
    label: 'SALE',
    hint: 'Nhân viên chủ',
    code: RoleCode.SALE,
  },
  CUSTOMER: {
    label: 'CUSTOMER',
    hint: 'Khách',
    code: RoleCode.CUSTOMER,
  },
};

interface PermissionGroup {
  id: string;
  label: string;
  permissions: Array<{
    key: string;
    label: string;
    /** Roles cho phép. */
    allow: Role[];
    /** Ghi chú giới hạn (vd: "của mình"). */
    note?: string;
  }>;
}

const GROUPS: PermissionGroup[] = [
  {
    id: 'platform',
    label: 'Vận hành hệ thống',
    permissions: [
      {
        key: 'view_global_dashboard',
        label: 'Xem dashboard tổng hệ thống',
        allow: ['ADMIN'],
      },
      {
        key: 'approve_kyc',
        label: 'Duyệt KYC chủ nhà',
        allow: ['ADMIN'],
      },
      {
        key: 'approve_property',
        label: 'Duyệt cơ sở mới',
        allow: ['ADMIN'],
      },
      {
        key: 'manage_users',
        label: 'Quản lý user (khoá / mở)',
        allow: ['ADMIN'],
      },
      {
        key: 'change_role',
        label: 'Đổi vai trò user',
        allow: ['ADMIN'],
      },
      {
        key: 'configure_email',
        label: 'Cấu hình email template',
        allow: ['ADMIN'],
      },
      {
        key: 'configure_permissions',
        label: 'Cấu hình quyền (trang này)',
        allow: ['ADMIN'],
      },
    ],
  },
  {
    id: 'disputes',
    label: 'Khiếu nại & hỗ trợ',
    permissions: [
      {
        key: 'view_disputes',
        label: 'Xem khiếu nại',
        allow: ['ADMIN'],
      },
      {
        key: 'resolve_disputes',
        label: 'Phán quyết khiếu nại',
        allow: ['ADMIN'],
      },
      {
        key: 'moderate_reviews',
        label: 'Kiểm duyệt review',
        allow: ['ADMIN'],
      },
    ],
  },
  {
    id: 'host-ops',
    label: 'Vận hành chủ nhà',
    permissions: [
      {
        key: 'manage_own_properties',
        label: 'Quản lý cơ sở của mình',
        allow: ['ADMIN', 'OWNER', 'SALE'],
        note: 'OWNER/SALE chỉ cơ sở thuộc tenant của mình',
      },
      {
        key: 'manage_calendar_pricing',
        label: 'Quản lý lịch + giá',
        allow: ['ADMIN', 'OWNER', 'SALE'],
      },
      {
        key: 'manage_bookings',
        label: 'Quản lý đặt phòng',
        allow: ['ADMIN', 'OWNER', 'SALE'],
      },
      {
        key: 'invite_staff',
        label: 'Mời nhân viên (SALE)',
        allow: ['ADMIN', 'OWNER'],
        note: 'SALE không thể tự mời người khác',
      },
      {
        key: 'manage_billing',
        label: 'Quản lý gói cước',
        allow: ['ADMIN', 'OWNER'],
      },
      {
        key: 'view_own_reports',
        label: 'Xem báo cáo doanh thu của mình',
        allow: ['ADMIN', 'OWNER', 'SALE'],
      },
    ],
  },
  {
    id: 'customer',
    label: 'Khách',
    permissions: [
      {
        key: 'book_property',
        label: 'Đặt phòng',
        allow: ['CUSTOMER'],
      },
      {
        key: 'review_property',
        label: 'Đánh giá cơ sở sau khi ở',
        allow: ['CUSTOMER'],
      },
      {
        key: 'open_dispute',
        label: 'Mở khiếu nại',
        allow: ['CUSTOMER'],
      },
    ],
  },
];

function Cell({ allowed }: { allowed: boolean }) {
  if (allowed) {
    return (
      <span
        aria-label="Có quyền"
        className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold"
      >
        ✓
      </span>
    );
  }
  return (
    <span
      aria-label="Không có quyền"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-ink-100 text-ink-300"
    >
      —
    </span>
  );
}

export default function AdminPermissionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Phân quyền"
        description="Ma trận quyền hạn (RBAC) theo CONTRACTS §1. Trang chỉ hiển thị mapping — chỉnh thực tế cần sửa code và deploy."
        breadcrumbs={[
          { label: 'Quản trị' },
          { label: 'Phân quyền' },
        ]}
      />

      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4 text-sm text-ink-700">
        <p className="font-semibold text-amber-900">⚠ Lưu ý</p>
        <p className="mt-1 leading-relaxed">
          RBAC hiện <strong>hard-code trong code</strong>. Trang này chỉ hiển
          thị mapping. Sửa quyền cần edit{' '}
          <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs">
            src/core/value-objects/role.ts
          </code>{' '}
          + các guard liên quan và tạo PR.
        </p>
      </div>

      {/* Role legend */}
      <section className="mt-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Vai trò trong hệ thống
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROLES.map((role) => {
            const meta = ROLE_META[role];
            return (
              <div
                key={role}
                className="rounded-xl border border-ink-100 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-bold text-navy-900">
                    {meta.label}
                  </p>
                  <Badge variant="default">code {meta.code}</Badge>
                </div>
                <p className="mt-1 text-xs text-ink-500">{meta.hint}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Permission matrix */}
      <section className="mt-6 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Ma trận quyền
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          ✓ = có quyền, — = không. Trang này read-only.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left">
                <th className="px-3 py-3 text-[11px] font-medium uppercase tracking-wider text-ink-500">
                  Quyền
                </th>
                {ROLES.map((role) => (
                  <th
                    key={role}
                    className="px-3 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-ink-500"
                  >
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => (
                <Fragment key={group.id}>
                  <tr>
                    <td
                      colSpan={ROLES.length + 1}
                      className="bg-cream-50 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500"
                    >
                      {group.label}
                    </td>
                  </tr>
                  {group.permissions.map((p) => (
                    <tr
                      key={p.key}
                      className="border-t border-ink-100 align-top"
                    >
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-ink-900">
                          {p.label}
                        </p>
                        {p.note && (
                          <p className="mt-0.5 text-[11px] text-ink-500 leading-snug">
                            {p.note}
                          </p>
                        )}
                      </td>
                      {ROLES.map((role) => (
                        <td
                          key={role}
                          className="px-3 py-3 text-center align-middle"
                        >
                          <Cell allowed={p.allow.includes(role)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
