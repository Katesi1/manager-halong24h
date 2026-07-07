'use client';

import Link from 'next/link';
import {
  AlertCircle,
  CalendarDays,
  Mail,
  MessageCircle,
  Phone,
} from 'lucide-react';

import { GuestLabelBadge } from '@/components/host/guest-label-badge';
import { StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import type { BookingStatus } from '@/core/entities/booking';
import type { GuestBookingRow, GuestDetail } from '@/core/entities/guest';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatBookingTotal,
} from '@/lib/booking-display';
import { displayName, formatDate, formatDateTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const STATUS_MAP: Record<number, BookingStatus> = {
  0: 'hold',
  1: 'confirmed',
  2: 'cancelled',
  3: 'completed',
  4: 'no_show',
};

function bookingStatusOf(raw: number | string): BookingStatus {
  if (typeof raw === 'number') return STATUS_MAP[raw] ?? 'hold';
  if (raw in BOOKING_STATUS_LABEL) return raw as BookingStatus;
  return 'hold';
}

/**
 * Chi tiết khách fetch từ `/api/guests/:id` PHÍA CLIENT → endpoint hiện trong
 * F12 Network. Loading/error/not-found ở client (không dùng notFound server).
 */
export function GuestDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<GuestDetail>(
    `/api/guests/${id}`,
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy khách'}
      </div>
    );
  }

  const guest = data;
  const name = displayName(guest.name, guest.email);
  const phoneDigits = guest.phone?.replace(/\D/g, '') ?? '';

  return (
    <>
      {guest.bannedAt && (
        <div className="mb-5 flex items-start gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Khách bị hạn chế</span> từ{' '}
            {formatDate(guest.bannedAt)}
            {guest.bannedReason ? ` · ${guest.bannedReason}` : ''}.
          </span>
        </div>
      )}

      <section className="rounded-2xl bg-white p-5 ring-1 ring-ink-200">
        <div className="flex flex-wrap items-center gap-4">
          <GradientAvatar name={name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                {name}
              </h2>
              <GuestLabelBadge label={guest.label} />
            </div>
            <p className="mt-1 text-sm text-ink-500">{guest.phone ?? '—'}</p>
            {guest.email && (
              <p className="truncate text-xs text-ink-500">{guest.email}</p>
            )}
            <p className="mt-1 text-xs text-ink-400">
              Tham gia {formatDate(guest.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            {guest.phone && (
              <>
                <a
                  href={`tel:${guest.phone.replace(/\s/g, '')}`}
                  aria-label="Gọi điện"
                  className="grid h-11 w-11 place-items-center rounded-full bg-navy-50 text-navy-700 transition-colors hover:bg-navy-100"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={`https://zalo.me/${phoneDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Mở Zalo"
                  className="grid h-11 w-11 place-items-center rounded-full bg-emerald-50 text-emerald-700 transition-colors hover:bg-emerald-100"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </>
            )}
            {guest.email && (
              <a
                href={`mailto:${guest.email}`}
                aria-label="Email"
                className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-700 transition-colors hover:bg-amber-100"
              >
                <Mail className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </section>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng lượt đặt" value={String(guest.stats.totalBookings)} />
        <StatCard label="Hoàn tất" value={String(guest.stats.completedBookings)} />
        <StatCard label="Đã huỷ" value={String(guest.stats.cancelledBookings)} />
      </div>

      <section className="mt-6">
        <h3 className="overline muted no-dash mb-2 text-[10px]">
          Lịch sử đặt phòng gần đây
        </h3>
        {guest.recentBookings.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-ink-200 bg-white px-4 py-6 text-sm text-ink-500">
            <CalendarDays className="h-5 w-5 text-ink-400" />
            Khách chưa có lịch sử đặt phòng.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-200 text-left text-[11px] uppercase tracking-wide text-ink-500">
                  <th className="px-4 py-3 font-semibold">Cơ sở</th>
                  <th className="px-4 py-3 font-semibold">Nhận / Trả phòng</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 text-right font-semibold">Tổng tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {guest.recentBookings.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function BookingRow({ booking }: { booking: GuestBookingRow }) {
  const status = bookingStatusOf(booking.status);
  return (
    <tr className="transition-colors hover:bg-cream-50">
      <td className="px-4 py-3">
        <Link
          href={`/host/properties/${booking.propertyId}`}
          className="font-medium text-navy-900 hover:underline"
        >
          {booking.property.name}
        </Link>
        {booking.property.code && (
          <p className="text-xs text-ink-400">{booking.property.code}</p>
        )}
      </td>
      <td className="px-4 py-3 text-ink-700">
        {formatDate(booking.checkinDate)} → {formatDate(booking.checkoutDate)}
        <p className="text-xs text-ink-400">{formatDateTime(booking.createdAt)}</p>
      </td>
      <td className="px-4 py-3">
        <Badge variant={BOOKING_STATUS_VARIANT[status]}>
          {BOOKING_STATUS_LABEL[status]}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right font-semibold text-ink-900">
        {formatBookingTotal(booking.totalAmount)}
      </td>
    </tr>
  );
}
