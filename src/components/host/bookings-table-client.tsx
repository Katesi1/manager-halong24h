'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { EmptyState } from '@/components/admin/empty-state';
import { Badge } from '@/components/ui/badge';
import { ClientPagination } from '@/components/ui/client-pagination';
import type { Booking, BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import { formatBookingTotal } from '@/lib/booking-display';
import { formatDate } from '@/lib/format';

const PAGE_SIZE = 15;

const STATUS_LABEL: Record<BookingStatus, string> = {
  hold: 'Giữ chỗ',
  confirmed: 'Chờ khách cọc',
  paid: 'Đã nhận tiền',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn tất',
  no_show: 'Khách không đến',
};

const STATUS_VARIANT: Record<
  BookingStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  hold: 'gold',
  confirmed: 'warning',
  paid: 'info',
  cancelled: 'danger',
  completed: 'success',
  no_show: 'dark',
};

interface LoadState {
  loading: boolean;
  error: string | null;
  bookings: Booking[];
}

/**
 * Bảng đặt phòng fetch từ `/api/bookings` PHÍA CLIENT → endpoint hiện trong F12
 * Network (cùng origin, token vẫn ở server qua BFF route). Fetch lại khi đổi tab
 * `status`. Phân trang in-memory (ClientPagination).
 */
export function BookingsTableClient({ status }: { status?: BookingStatus }) {
  const [state, setState] = useState<LoadState>({
    loading: true,
    error: null,
    bookings: [],
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, loading: true, error: null }));
    setPage(1);
    const qs = status ? `?status=${status}` : '';
    fetch(`/api/bookings${qs}`, { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(json.error || 'Không tải được danh sách đặt phòng');
        }
        return json.data as Booking[];
      })
      .then((data) => {
        if (!cancelled) {
          setState({ loading: false, error: null, bookings: data ?? [] });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            loading: false,
            error:
              err instanceof Error ? err.message : 'Không tải được danh sách',
            bookings: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  if (state.loading) {
    return (
      <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }

  if (state.error) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
      >
        <span className="font-semibold">Không tải được danh sách: </span>
        {state.error}
      </div>
    );
  }

  if (state.bookings.length === 0) {
    return (
      <EmptyState
        icon="🛎️"
        title="Không có đặt phòng phù hợp"
        description={
          status
            ? 'Không có đặt phòng nào ở trạng thái này. Thử chọn tab khác.'
            : 'Khi có đặt phòng mới, chúng sẽ xuất hiện ở đây.'
        }
        ctaLabel="+ Tạo đặt phòng"
        ctaHref="/host/bookings/new"
      />
    );
  }

  const totalPages = Math.ceil(state.bookings.length / PAGE_SIZE);
  const pageItems = state.bookings.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
    <>
      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
            <tr>
              <th className="px-4 py-3">Mã</th>
              <th className="px-4 py-3">Khách</th>
              <th className="px-4 py-3">Phòng</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3">Tổng</th>
              <th className="px-4 py-3">Đã đặt cọc</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-200">
            {pageItems.map((b) => (
              <tr key={b.id} className="hover:bg-cream-100">
                <td className="px-4 py-3">
                  <Link
                    href={`/host/bookings/${b.id}`}
                    className="font-mono text-xs font-semibold text-navy-700 hover:underline"
                  >
                    {b.id.slice(0, 12)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-ink-900">{b.guestName}</p>
                  <p className="text-xs text-ink-500">{b.guestPhone ?? '—'}</p>
                </td>
                <td className="px-4 py-3 text-ink-700">
                  <p className="line-clamp-1">{b.propertyName}</p>
                  <p className="text-xs text-ink-500">{b.guestCount} khách</p>
                </td>
                <td className="px-4 py-3 text-ink-700 whitespace-nowrap">
                  {formatDate(b.checkInAt)}
                  <br />
                  <span className="text-xs text-ink-500">
                    → {formatDate(b.checkOutAt)}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-ink-900 whitespace-nowrap">
                  {formatBookingTotal(b.totalPrice)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={
                      (b.deposit ?? 0) >= (b.totalPrice ?? 0) &&
                      b.deposit != null
                        ? 'text-emerald-700 font-medium'
                        : (b.deposit ?? 0) > 0
                          ? 'text-amber-700 font-medium'
                          : 'text-ink-500'
                    }
                  >
                    {formatVND(b.deposit)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[b.status]}>
                    {STATUS_LABEL[b.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={state.bookings.length}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
