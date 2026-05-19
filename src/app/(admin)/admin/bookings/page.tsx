import Link from 'next/link';

import { listBookingsAction } from '@/app/actions/bookings';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
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

export default async function AdminBookingsPage() {
  const result = await listBookingsAction();
  const bookings: Booking[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Tất cả booking"
        description="Theo dõi mọi đặt phòng trên toàn hệ thống."
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được booking: </span>
          {apiError}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-ink-500">
          Chưa có đặt phòng nào
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
          <table className="w-full text-sm">
            <thead className="border-b border-ink-200 bg-cream-100 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              <tr>
                <th className="px-4 py-3">Mã</th>
                <th className="px-4 py-3">Khách</th>
                <th className="px-4 py-3">Cơ sở</th>
                <th className="px-4 py-3">Ngày</th>
                <th className="px-4 py-3">Tổng</th>
                <th className="px-4 py-3">Đặt cọc</th>
                <th className="px-4 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-200">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-cream-100">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/bookings/${b.id}`}
                      className="font-mono text-xs font-semibold text-navy-700 hover:underline"
                    >
                      {b.id.slice(0, 12)}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{b.guestName}</p>
                    <p className="text-xs text-ink-500">{b.guestPhone ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-700 line-clamp-1">
                    {b.propertyName}
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
                  <td className="px-4 py-3 whitespace-nowrap text-ink-700">
                    {formatVND(b.deposit)}
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
