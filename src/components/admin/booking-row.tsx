'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatBookingTotal,
} from '@/lib/booking-display';
import { formatDate } from '@/lib/format';

/**
 * Một dòng booking trong bảng admin. Click cả dòng → trang chi tiết.
 * Link SĐT vẫn bấm gọi được riêng (stopPropagation), điều hướng bàn phím
 * qua Enter/Space để giữ accessibility.
 */
export function BookingRow({ booking }: { booking: Booking }) {
  const router = useRouter();
  const href = `/admin/bookings/${booking.id}`;

  const go = () => router.push(href);

  return (
    <tr
      onClick={go}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          go();
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Xem booking ${booking.id.slice(0, 8)} của ${booking.guestName}`}
      className="group cursor-pointer outline-none transition-colors hover:bg-cream-100 focus-visible:bg-cream-100"
    >
      <td className="px-4 py-3.5">
        <span className="font-mono text-xs font-semibold text-navy-700 group-hover:underline">
          {booking.id.slice(0, 8)}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <p className="font-medium text-ink-900">{booking.guestName}</p>
        {booking.guestPhone ? (
          <a
            href={`tel:${booking.guestPhone}`}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 text-xs text-ink-500 hover:text-navy-700 hover:underline"
          >
            {booking.guestPhone}
          </a>
        ) : (
          <span className="text-xs text-ink-400">— chưa có SĐT</span>
        )}
      </td>
      <td className="px-4 py-3.5">
        <p className="line-clamp-1 max-w-[200px] text-ink-700">
          {booking.propertyName || '—'}
        </p>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-ink-700">
        <span className="text-sm">{formatDate(booking.checkInAt)}</span>
        <span className="mx-1 text-ink-300">→</span>
        <span className="text-sm">{formatDate(booking.checkOutAt)}</span>
        <span className="ml-2 text-xs text-ink-400">{booking.nights} đêm</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right font-semibold text-ink-900">
        {booking.totalPrice == null ? (
          <span className="text-xs font-normal text-ink-400">Chưa chốt giá</span>
        ) : (
          formatBookingTotal(booking.totalPrice)
        )}
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 text-right text-ink-700">
        {formatVND(booking.deposit)}
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
          {BOOKING_STATUS_LABEL[booking.status]}
        </Badge>
      </td>
      <td className="px-2 py-3.5 text-right">
        <ChevronRight className="ml-auto h-4 w-4 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-navy-700" />
      </td>
    </tr>
  );
}
