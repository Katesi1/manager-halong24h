import { listStaffAction, listStaffInvitesAction } from '@/app/actions/staff';
import { EmptyState } from '@/components/admin/empty-state';
import { InviteStaffForm } from '@/components/host/invite-staff-form';
import { PageHeader } from '@/components/host/page-header';
import { StaffRowActions } from '@/components/host/staff-row-actions';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  STAFF_INVITE_STATUS_LABEL,
  type StaffInvite,
  type StaffMember,
} from '@/core/entities/staff';
import { formatDate } from '@/lib/format';
import { buildPageHref, pageCount, paginate, parsePage } from '@/lib/pagination';

const PAGE_SIZE = 10;

export default async function HostStaffPage(props: {
  searchParams: Promise<{ staffPage?: string; invitePage?: string }>;
}) {
  const sp = await props.searchParams;
  const [staffResult, invitesResult] = await Promise.all([
    listStaffAction({ isActive: true }),
    listStaffInvitesAction({ status: 'pending' }),
  ]);

  const staff: StaffMember[] = staffResult.ok ? staffResult.data : [];
  const invites: StaffInvite[] = invitesResult.ok ? invitesResult.data : [];

  const apiError =
    (!staffResult.ok ? staffResult.error : null) ||
    (!invitesResult.ok ? invitesResult.error : null);

  const staffPage = parsePage(sp.staffPage);
  const staffTotalPages = pageCount(staff.length, PAGE_SIZE);
  const staffItems = paginate(staff, staffPage, PAGE_SIZE);

  const invitePage = parsePage(sp.invitePage);
  const inviteTotalPages = pageCount(invites.length, PAGE_SIZE);
  const inviteItems = paginate(invites, invitePage, PAGE_SIZE);

  function staffPageHref(page: number) {
    return buildPageHref('/host/staff', {
      staffPage: page > 1 ? String(page) : undefined,
      invitePage: sp.invitePage,
    });
  }

  function invitePageHref(page: number) {
    return buildPageHref('/host/staff', {
      staffPage: sp.staffPage,
      invitePage: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Nhân viên SALE"
        description="Mời SALE qua email. SALE accept tạo tài khoản role=2 và được gán vào bạn."
      />

      {apiError && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được danh sách: </span>
          {apiError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {/* Active staff list */}
          <section className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <header className="flex items-baseline justify-between border-b border-ink-200 px-4 py-3">
              <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
                SALE đang hoạt động ({staff.length})
              </h2>
            </header>
            {apiError ? null : staff.length === 0 ? (
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
            <Pagination
              currentPage={staffPage}
              totalPages={staffTotalPages}
              totalItems={staff.length}
              pageSize={PAGE_SIZE}
              buildHref={staffPageHref}
            />
          )}

          {/* Pending invites */}
          {invites.length > 0 && (
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
                        <StaffRowActions
                          kind="invite"
                          id={inv.id}
                          name={inv.email}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {invites.length > 0 && (
            <Pagination
              currentPage={invitePage}
              totalPages={inviteTotalPages}
              totalItems={invites.length}
              pageSize={PAGE_SIZE}
              buildHref={invitePageHref}
            />
          )}
        </div>

        {/* Invite form */}
        <aside
          id="invite-form"
          className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card h-fit scroll-mt-20"
        >
          <h3 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Mời SALE mới
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Cần KYC approved + subscription active.
          </p>
          <div className="mt-4">
            <InviteStaffForm />
          </div>
        </aside>
      </div>

    </div>
  );
}
