import { CalendarRange, ClipboardList } from 'lucide-react';
import Link from 'next/link';

import { listBookingsAction } from '@/app/actions/bookings';
import { BookingRow } from '@/components/admin/booking-row';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { Pagination } from '@/components/ui/pagination';
import type { Booking, BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import { BOOKING_STATUS_LABEL } from '@/lib/booking-display';
import { buildPageHref, pageCount, paginate, parsePage } from '@/lib/pagination';

const PAGE_SIZE = 10;

type TabKey = BookingStatus | 'all';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'hold', label: BOOKING_STATUS_LABEL.hold },
  { key: 'confirmed', label: BOOKING_STATUS_LABEL.confirmed },
  { key: 'paid', label: BOOKING_STATUS_LABEL.paid },
  { key: 'completed', label: BOOKING_STATUS_LABEL.completed },
  { key: 'no_show', label: BOOKING_STATUS_LABEL.no_show },
  { key: 'cancelled', label: BOOKING_STATUS_LABEL.cancelled },
];

const VALID_STATUS: ReadonlySet<string> = new Set<BookingStatus>([
  'hold',
  'confirmed',
  'paid',
  'cancelled',
  'completed',
  'no_show',
]);

export default async function AdminBookingsPage(props: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const result = await listBookingsAction();
  const all: Booking[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const activeTab: TabKey =
    sp.status && VALID_STATUS.has(sp.status) ? (sp.status as BookingStatus) : 'all';

  const bookings =
    activeTab === 'all' ? all : all.filter((b) => b.status === activeTab);

  const currentPage = parsePage(sp.page);
  const totalPages = pageCount(bookings.length, PAGE_SIZE);
  const pageItems = paginate(bookings, currentPage, PAGE_SIZE);

  function pageHref(page: number) {
    return buildPageHref('/admin/bookings', {
      status: activeTab === 'all' ? undefined : activeTab,
      page: page > 1 ? String(page) : undefined,
    });
  }

  // Số lượng theo từng trạng thái cho badge trên tab.
  const countOf = (key: TabKey) =>
    key === 'all' ? all.length : all.filter((b) => b.status === key).length;

  const holdCount = all.filter((b) => b.status === 'hold').length;
  const confirmedCount = all.filter((b) => b.status === 'confirmed').length;
  const revenue = all
    .filter((b) => b.status === 'paid' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Vận hành"
        title="Tất cả booking"
        description="Theo dõi mọi đặt phòng trên toàn hệ thống. Bấm vào một dòng để xem chi tiết."
      />

      {apiError && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được booking: </span>
          {apiError}
        </div>
      )}

      {/* Stat tiles */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={String(all.length)}
          hint="trên toàn hệ thống"
        />
        <StatCard
          label="Đang giữ chỗ"
          value={String(holdCount)}
          hint="chờ chủ nhà xác nhận"
        />
        <StatCard
          label="Chờ khách cọc"
          value={String(confirmedCount)}
          hint="đã xác nhận, chờ chuyển tiền"
        />
        <StatCard
          label="Doanh thu ghi nhận"
          value={formatVND(revenue)}
          hint="booking đã nhận tiền / hoàn tất"
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const href =
            tab.key === 'all'
              ? '/admin/bookings'
              : `/admin/bookings?status=${tab.key}`;
          return (
            <Link
              key={tab.key}
              href={href}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
                (isActive
                  ? 'bg-navy-900 text-cream-50'
                  : 'bg-white text-ink-700 ring-1 ring-ink-200/70 hover:bg-cream-100')
              }
            >
              {tab.label}
              <span
                className={
                  'rounded-full px-1.5 text-xs font-semibold ' +
                  (isActive ? 'bg-cream-50/20 text-cream-50' : 'text-ink-400')
                }
              >
                {countOf(tab.key)}
              </span>
            </Link>
          );
        })}
      </div>

      {bookings.length === 0 ? (
        <EmptyState activeTab={activeTab} hasAny={all.length > 0} />
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Cơ sở</th>
                <th className="px-4 py-3">Lưu trú</th>
                <th className="px-4 py-3 text-right">Tổng</th>
                <th className="px-4 py-3 text-right">Đặt cọc</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200/70">
              {pageItems.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {bookings.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={bookings.length}
          pageSize={PAGE_SIZE}
          buildHref={pageHref}
        />
      )}
    </div>
  );
}

function EmptyState({
  activeTab,
  hasAny,
}: {
  activeTab: TabKey;
  hasAny: boolean;
}) {
  const filtered = activeTab !== 'all' && hasAny;
  const Icon = filtered ? ClipboardList : CalendarRange;
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-ink-300" />
      <p className="mt-3 font-medium text-ink-900">
        {filtered
          ? `Không có booking nào ở trạng thái "${BOOKING_STATUS_LABEL[activeTab as BookingStatus]}"`
          : 'Chưa có đặt phòng nào'}
      </p>
      {filtered && (
        <Link
          href="/admin/bookings"
          className="mt-3 inline-block text-sm font-semibold text-navy-700 hover:underline"
        >
          ← Xem tất cả booking
        </Link>
      )}
    </div>
  );
}
