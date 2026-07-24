'use client';

import { useEffect, useMemo, useState } from 'react';
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
export function AdminBookingsClient({
  status,
  ownerId,
  saleId,
  customerId,
}: {
  status?: BookingStatus;
  ownerId?: string;
  saleId?: string;
  customerId?: string;
}) {
  const { loading, error, data } = useApiResource<Booking[]>(
    '/api/admin/bookings',
  );
  const [page, setPage] = useState(1);
  // Đổi tab (status) → về trang 1.
  useEffect(() => setPage(1), [status]);

  const all = data ?? [];

  // Lọc theo vai trò (chủ nhà, sale, khách hàng)
  const filteredByRole = useMemo(() => {
    return all.filter((b) => {
      if (ownerId && (b as any).ownerId !== ownerId) return false;
      if (saleId && b.saleId !== saleId) return false;
      if (customerId && b.customerId !== customerId) return false;
      return true;
    });
  }, [all, ownerId, saleId, customerId]);

  // Thông tin hiển thị banner khi lọc
  const filterInfo = useMemo(() => {
    if (ownerId) {
      return { label: 'chủ nhà', value: `Chủ nhà (ID: ${ownerId})` };
    }
    if (saleId) {
      return { label: 'nhân viên SALE', value: `SALE (ID: ${saleId})` };
    }
    if (customerId) {
      const found = filteredByRole.find((b) => b.customerId === customerId);
      const name = found?.guestName ? `${found.guestName} (ID: ${customerId})` : `Khách (ID: ${customerId})`;
      return { label: 'khách hàng', value: name };
    }
    return null;
  }, [filteredByRole, ownerId, saleId, customerId]);

  const activeTab: TabKey = status ?? 'all';
  const bookings =
    activeTab === 'all'
      ? filteredByRole
      : filteredByRole.filter((b) => b.status === activeTab);

  const countOf = (key: TabKey) =>
    key === 'all'
      ? filteredByRole.length
      : filteredByRole.filter((b) => b.status === key).length;
  const holdCount = countOf('hold');
  const confirmedCount = countOf('confirmed');
  const revenue = filteredByRole
    .filter((b) => b.status === 'paid' || b.status === 'completed')
    .reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);

  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const pageItems = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

  return (
    <>
      {filterInfo && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-navy-50 px-4 py-2.5 text-sm text-navy-900 ring-1 ring-navy-200">
          <span>
            Đang lọc theo {filterInfo.label}: <strong>{filterInfo.value}</strong>
          </span>
          <Link
            href="/admin/bookings"
            className="text-xs font-semibold text-navy-700 hover:text-navy-900 underline"
          >
            Bỏ lọc
          </Link>
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tổng booking" value={String(filteredByRole.length)} hint="trên toàn hệ thống" />
        <StatCard label="Đang giữ chỗ" value={String(holdCount)} hint="chờ chủ nhà xác nhận" />
        <StatCard label="Chờ khách cọc" value={String(confirmedCount)} hint="đã xác nhận, chờ chuyển tiền" />
        <StatCard label="Doanh thu ghi nhận" value={formatVND(revenue)} hint="booking đã nhận tiền / hoàn tất" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const params = new URLSearchParams();
          if (tab.key !== 'all') params.set('status', tab.key);
          if (ownerId) params.set('ownerId', ownerId);
          if (saleId) params.set('saleId', saleId);
          if (customerId) params.set('customerId', customerId);
          const qs = params.toString();
          const href = qs ? `/admin/bookings?${qs}` : '/admin/bookings';

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
