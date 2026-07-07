'use client';

import { useState } from 'react';

import { EmptyState } from '@/components/admin/empty-state';
import { StaffRowActions } from '@/components/host/staff-row-actions';
import { Badge } from '@/components/ui/badge';
import { ClientPagination } from '@/components/ui/client-pagination';
import {
  STAFF_INVITE_STATUS_LABEL,
  type StaffInvite,
  type StaffMember,
} from '@/core/entities/staff';
import { formatDate } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 10;

interface StaffData {
  staff: StaffMember[];
  invites: StaffInvite[];
}

/**
 * Danh sách SALE + lời mời fetch từ `/api/staff` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Phân trang in-memory mỗi bảng.
 */
export function StaffListsClient() {
  const { loading, error, data } = useApiResource<StaffData>('/api/staff');
  const [staffPage, setStaffPage] = useState(1);
  const [invitePage, setInvitePage] = useState(1);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Không tải được danh sách: </span>
        {error}
      </div>
    );
  }

  const staff = data?.staff ?? [];
  const invites = data?.invites ?? [];
  const staffItems = staff.slice(
    (staffPage - 1) * PAGE_SIZE,
    staffPage * PAGE_SIZE,
  );
  const inviteItems = invites.slice(
    (invitePage - 1) * PAGE_SIZE,
    invitePage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <section className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
        <header className="flex items-baseline justify-between border-b border-ink-200 px-4 py-3">
          <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
            SALE đang hoạt động ({staff.length})
          </h2>
        </header>
        {staff.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon="🧑‍💼"
              title="Chưa có SALE nào"
              description="Mời nhân viên SALE qua email ở khung bên phải. SALE sẽ được gán vào tài khoản của bạn sau khi accept."
            />
          </div>
        ) : (
          <table className="w-full min-w-[600px] text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Tên</th>
                <th className="px-4 py-3">Liên hệ</th>
                <th className="px-4 py-3">Tham gia</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {staffItems.map((s) => (
                <tr key={s.id} className="hover:bg-cream-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-full bg-navy-900 text-white text-xs font-semibold">
                        {s.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-ink-900">{s.name}</p>
                        <p className="text-xs text-ink-500">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-700">
                    {s.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <StaffRowActions kind="staff" id={s.id} name={s.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {staff.length > 0 && (
        <ClientPagination
          currentPage={staffPage}
          totalPages={Math.ceil(staff.length / PAGE_SIZE)}
          onPageChange={setStaffPage}
          totalItems={staff.length}
          pageSize={PAGE_SIZE}
        />
      )}

      {invites.length > 0 && (
        <>
          <section className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <header className="flex items-baseline justify-between border-b border-ink-200 px-4 py-3">
              <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
                Lời mời đang chờ ({invites.length})
              </h2>
            </header>
            <table className="w-full min-w-[600px] text-sm">
              <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Mã ngắn</th>
                  <th className="px-4 py-3">Hết hạn</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {inviteItems.map((inv) => (
                  <tr key={inv.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3 font-medium text-ink-900">
                      {inv.email}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {inv.shortCode}
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-500">
                      {formatDate(inv.expiresAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="gold">
                        {STAFF_INVITE_STATUS_LABEL[inv.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StaffRowActions kind="invite" id={inv.id} name={inv.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <ClientPagination
            currentPage={invitePage}
            totalPages={Math.ceil(invites.length / PAGE_SIZE)}
            onPageChange={setInvitePage}
            totalItems={invites.length}
            pageSize={PAGE_SIZE}
          />
        </>
      )}
    </div>
  );
}
