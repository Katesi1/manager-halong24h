'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarRange, ClipboardList } from 'lucide-react';

import { BookingRow } from '@/components/admin/booking-row';
import { StatCard } from '@/components/host/page-header';
import { ClientPagination } from '@/components/ui/client-pagination';
import type { Booking, BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import { BOOKING_STATUS_LABEL } from '@/lib/booking-display';
import { useApiResource } from '@/lib/use-api-resource';

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

/**
 * Toàn bộ booking fetch từ `/api/admin/bookings` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Stats + filter theo tab (URL) + phân trang in-memory.
 */
export function AdminBookingsClient({ status }: { status?: BookingStatus }) {
  const { loading, error, data } = useApiResource<Booking[]>(
    '/api/admin/bookings',
  );
  const [page, setPage] = useState(1);
  // Đổi tab (status) → về trang 1.
  useEffect(() => setPage(1), [status]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Không tải được booking: </span>
        {error}
      </div>
    );
  }

  const all = data ?? [];
  const activeTab: TabKey = status ?? 'all';
  const bookings =
    activeTab === 'all' ? all : all.filter((b) => b.status === activeTab);

  const countOf = (key: TabKey) =>
    key === 'all' ? all.length : all.filter((b) => b.status === key).length;
  const holdCount = countOf('hold');
  const confirmedCount = countOf('confirmed');
  const revenue = all
    .filter((b) => b.status === 'paid' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const pageItems = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng booking" value={String(all.length)} hint="trên toàn hệ thống" />
        <StatCard label="Đang giữ chỗ" value={String(holdCount)} hint="chờ chủ nhà xác nhận" />
        <StatCard label="Chờ khách cọc" value={String(confirmedCount)} hint="đã xác nhận, chờ chuyển tiền" />
        <StatCard label="Doanh thu ghi nhận" value={formatVND(revenue)} hint="booking đã nhận tiền / hoàn tất" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const href =
            tab.key === 'all' ? '/admin/bookings' : `/admin/bookings?status=${tab.key}`;
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
        <ClientPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={bookings.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </>
  );
}

function EmptyState({ activeTab, hasAny }: { activeTab: TabKey; hasAny: boolean }) {
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
