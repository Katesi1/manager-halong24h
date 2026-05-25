import type { Metadata } from 'next';
import Link from 'next/link';

import { listBookingsAction } from '@/app/actions/bookings';

export const metadata: Metadata = { title: 'Đặt phòng' };
import { EmptyState } from '@/components/admin/empty-state';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Booking, BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate } from '@/lib/format';

const STATUS_LABEL: Record<BookingStatus, string> = {
  hold: 'Giữ chỗ',
  confirmed: 'Chờ khách cọc',
  paid: 'Đã nhận tiền',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn tất',
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
};

const TABS: { key: '' | BookingStatus; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'hold', label: 'Đang giữ' },
  { key: 'confirmed', label: 'Chờ cọc' },
  { key: 'paid', label: 'Đã nhận tiền' },
  { key: 'completed', label: 'Hoàn tất' },
  { key: 'cancelled', label: 'Đã huỷ' },
];

function isBookingStatus(s: string | undefined): s is BookingStatus {
  return (
    s === 'hold' ||
    s === 'confirmed' ||
    s === 'paid' ||
    s === 'cancelled' ||
    s === 'completed'
  );
}

export default async function BookingsListPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isBookingStatus(sp.status) ? sp.status : undefined;
  const result = await listBookingsAction(status ? { status } : undefined);
  const bookings: Booking[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Đặt phòng"
        description="Quản lý đặt phòng — khách trực tiếp, đặt online, hoặc từ yêu cầu khách."
        actions={
          <Link href="/host/bookings/new">
            <Button>+ Tạo đặt phòng</Button>
          </Link>
        }
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

      <div className="mb-4 flex flex-wrap gap-2 border-b border-ink-200 overflow-x-auto">
        {TABS.map((t) => {
          const active = (sp.status ?? '') === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/host/bookings?status=${t.key}` : '/host/bookings'}
              className={
                'shrink-0 border-b-2 px-3 py-2 text-sm font-medium ' +
                (active
                  ? 'border-ink-900 text-ink-900'
                  : 'border-transparent text-ink-500 hover:text-ink-900')
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {apiError ? null : bookings.length === 0 ? (
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
      ) : (
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
              {bookings.map((b) => (
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
                    {formatVND(b.totalPrice)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={
                        b.deposit >= b.totalPrice
                          ? 'text-emerald-700 font-medium'
                          : b.deposit > 0
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
      )}
    </div>
  );
}
