import type { Metadata } from 'next';
import Link from 'next/link';
import { UserCog } from 'lucide-react';

import { listAdminUsersAction } from '@/app/actions/admin-users';
import { getPermissionsAction } from '@/app/actions/permissions';
import { PermissionEditor } from '@/components/admin/permission-editor';
import { PageHeader } from '@/components/host/page-header';
import { modulesForScope } from '@/core/entities/permission';
import { RoleCode } from '@/core/value-objects/role';

export const metadata: Metadata = { title: 'Phân quyền' };

export default async function AdminPermissionsPage(props: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await props.searchParams;

  if (userId) {
    const res = await getPermissionsAction(userId);
    if (!res.ok) {
      return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          <PageHeader
            eyebrow="Cấu hình"
            title="Phân quyền"
            description="Cấu hình quyền thao tác theo từng module cho nhân viên SALE."
            breadcrumbs={[
              { label: 'Phân quyền', href: '/admin/permissions' },
              { label: 'Lỗi' },
            ]}
          />
          <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
            Không tải được phân quyền: {res.error}
          </div>
        </div>
      );
    }

    // Lấy tên user để hiển thị (best-effort)
    const userListRes = await listAdminUsersAction({});
    const user = userListRes.ok
      ? userListRes.data.find((u) => u.id === userId)
      : null;
    const label = user ? `${user.name} (${user.email})` : userId;

    // Sale hệ thống (scope=system) → 18 module (4 owner + 14 admin, spec §26.5).
    const isSystem = res.data.scope === 'system';
    const modules = modulesForScope(res.data.scope);
    const hint = isSystem
      ? 'Sale hệ thống — quyền trên toàn nền tảng, mặc định tắt hết. Chỉ bật những module nhân viên này phụ trách.'
      : undefined;

    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
        <PageHeader
          eyebrow="Cấu hình"
          title="Phân quyền nhân viên"
          description="Bật/tắt từng quyền thao tác theo module. Lưu áp dụng ngay."
          breadcrumbs={[
            { label: 'Phân quyền', href: '/admin/permissions' },
            { label: user?.name ?? 'Chi tiết' },
          ]}
        />
        <PermissionEditor
          userId={userId}
          userLabel={label}
          initial={res.data.permissions}
          modules={modules}
          hint={hint}
        />
      </div>
    );
  }

  // Chưa chọn user → hiển thị list SALE để admin pick.
  const usersRes = await listAdminUsersAction({ role: RoleCode.SALE });
  const saleUsers = usersRes.ok ? usersRes.data : [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Cấu hình"
        title="Phân quyền hệ thống"
        description="Chọn 1 nhân viên SALE để cấu hình quyền thao tác theo từng module (Cơ sở, Booking, Lịch, Review)."
      />

      {!usersRes.ok && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Không tải được danh sách nhân viên: {usersRes.error}
        </div>
      )}

      {saleUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <UserCog className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Chưa có nhân viên SALE nào
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Nhân viên SALE được chủ nhà mời qua email, hoặc do ADMIN tạo.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nhân viên</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Owner</th>
                <th className="px-4 py-3 text-right font-medium w-32">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {saleUsers.map((u) => (
                <tr key={u.id} className="border-t border-ink-100 hover:bg-cream-50">
                  <td className="px-4 py-3 font-medium text-ink-900">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-ink-600">{u.email}</td>
                  <td className="px-4 py-3 text-ink-600">
                    {u.scope === 'system' ? (
                      <span className="inline-flex rounded-full bg-navy-900/5 px-2.5 py-0.5 text-xs font-medium text-navy-800 ring-1 ring-navy-900/15">
                        Sale hệ thống
                      </span>
                    ) : u.ownerId ? (
                      <code className="text-xs">{u.ownerId.slice(0, 8)}</code>
                    ) : (
                      <span className="text-amber-700">Chưa gán</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/permissions?userId=${u.id}`}
                      className="text-sm font-medium text-navy-700 hover:underline"
                    >
                      Cấu hình →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
