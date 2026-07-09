'use client';

import {
  Building2,
  CalendarDays,
  Clock,
  Phone,
  StickyNote,
  Users,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { Booking } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import {
  BOOKING_STATUS_LABEL,
  BOOKING_STATUS_VARIANT,
  formatBookingTotal,
  holdSecondsLeft,
} from '@/lib/booking-display';
import { formatDate, formatDateTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Chi tiết booking (admin) fetch từ `/api/admin/bookings/:id` PHÍA CLIENT →
 * endpoint hiện trong F12 Network. Loading/error/not-found ở client.
 */
export function AdminBookingDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<Booking>(
    `/api/admin/bookings/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy booking'}
      </div>
    );
  }

  const booking = data;
  const hasTotal = booking.totalPrice != null;
  const paid = booking.paidAmount ?? 0;
  const remaining =
    booking.remainingAmount != null
      ? booking.remainingAmount
      : hasTotal
        ? Math.max(0, booking.totalPrice! - paid)
        : null;
  const fullyPaid = hasTotal && booking.totalPrice! > 0 && paid >= booking.totalPrice!;

  return (
    <>
      <PageHeader
        backHref="/admin/bookings"
        backLabel="Quay lại danh sách booking"
        eyebrow="Vận hành"
        title={`Booking ${booking.id.slice(0, 8)}`}
        description={`Tạo lúc ${formatDateTime(booking.createdAt)}`}
        breadcrumbs={[
          { label: 'Booking', href: '/admin/bookings' },
          { label: booking.id.slice(0, 8) },
        ]}
        actions={
          <Badge variant={BOOKING_STATUS_VARIANT[booking.status]}>
            {BOOKING_STATUS_LABEL[booking.status]}
          </Badge>
        }
      />

      {booking.status === 'hold' && (
        <HoldBanner secondsLeft={holdSecondsLeft(booking)} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-200/60">
            <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
              Thông tin khách &amp; lưu trú
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Detail icon={Users} label="Khách" value={booking.guestName} />
              <Detail
                icon={Phone}
                label="Số điện thoại"
                value={
                  booking.guestPhone ? (
                    <a
                      href={`tel:${booking.guestPhone}`}
                      className="font-semibold text-navy-700 hover:underline"
                    >
                      {booking.guestPhone}
                    </a>
                  ) : (
                    '—'
                  )
                }
              />
              <Detail
                icon={Users}
                label="Số khách"
                value={
                  booking.adults != null
                    ? `${booking.adults} người lớn${
                        booking.children ? ` + ${booking.children} trẻ em` : ''
                      }`
                    : `${booking.guestCount} người`
                }
              />
              <Detail icon={CalendarDays} label="Số đêm" value={`${booking.nights} đêm`} />
              <Detail icon={CalendarDays} label="Nhận phòng" value={formatDate(booking.checkInAt)} />
              <Detail icon={CalendarDays} label="Trả phòng" value={formatDate(booking.checkOutAt)} />
            </div>
            {booking.notes && (
              <div className="mt-4 rounded-lg bg-cream-100 p-3">
                <p className="overline muted no-dash flex items-center gap-1.5 text-[10px]">
                  <StickyNote className="h-3 w-3" /> Ghi chú
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-900">
                  {booking.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-200/60">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight text-navy-900">
              <Building2 className="h-5 w-5 text-ink-400" /> Cơ sở
            </h2>
            <div className="mt-3">
              <Link
                href={`/admin/properties/${booking.propertyId}`}
                className="font-medium text-navy-700 hover:underline"
              >
                {booking.propertyName || 'Xem cơ sở'} ↗
              </Link>
              <p className="mt-1 font-mono text-xs text-ink-500">
                {booking.propertyId}
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-ink-200/60">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
                Thanh toán
              </h2>
              {fullyPaid && <Badge variant="success">Đã nhận đủ</Badge>}
            </div>
            <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
              <Money label="Tổng" value={formatBookingTotal(booking.totalPrice)} />
              <Money
                label="Cọc cần thu"
                value={
                  booking.deposit != null ? formatVND(booking.deposit) : 'Chưa yêu cầu'
                }
              />
              <Money label="Đã thu" value={formatVND(paid)} color="emerald" />
              <Money
                label="Còn lại"
                value={remaining == null ? 'Chưa chốt giá' : formatVND(remaining)}
                color={remaining != null && remaining > 0 ? 'amber' : 'emerald'}
              />
            </div>
            {booking.priceBreakdown && (
              <p className="mt-3 text-[11px] text-ink-500">
                {booking.priceBreakdown.nights} đêm
                {booking.priceBreakdown.surcharge > 0
                  ? ` · phụ thu ${formatVND(booking.priceBreakdown.surcharge)}`
                  : ''}
              </p>
            )}
            {booking.depositProofUrl && (
              <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-4">
                <p className="text-sm font-semibold text-sky-900">
                  🧾 Ảnh bill cọc khách gửi
                </p>
                <a
                  href={booking.depositProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block"
                >
                  <Image
                    src={booking.depositProofUrl}
                    alt="Bill chuyển khoản cọc của khách"
                    width={320}
                    height={240}
                    unoptimized
                    className="max-h-72 w-auto rounded-lg object-contain ring-1 ring-sky-200"
                  />
                </a>
                <p className="mt-2 text-[11px] text-sky-700">
                  Bấm ảnh để xem đầy đủ.
                </p>
              </div>
            )}
            <p className="mt-4 rounded-lg bg-cream-100 p-3 text-xs leading-relaxed text-ink-600">
              Halong24h không giữ tiền. Khách chuyển khoản trực tiếp cho chủ nhà
              (STK đã KYC). Số liệu trên đối soát theo dữ liệu BE ghi nhận.
            </p>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
            <h3 className="overline muted no-dash text-[10px]">
              Thông tin hệ thống
            </h3>
            <dl className="mt-3 space-y-3 text-sm">
              <Meta label="Mã booking" value={booking.id} mono />
              <Meta
                label="Sale phụ trách"
                value={booking.saleId ?? '— (chủ nhà tự quản)'}
                mono={!!booking.saleId}
              />
              <Meta
                label="Customer ID"
                value={booking.customerId ?? '— (khách vãng lai)'}
                mono={!!booking.customerId}
              />
              <Meta label="Tạo lúc" value={formatDateTime(booking.createdAt)} />
              {booking.updatedAt && (
                <Meta label="Cập nhật" value={formatDateTime(booking.updatedAt)} />
              )}
            </dl>
            <Link
              href={`/admin/properties/${booking.propertyId}`}
              className="mt-5 block rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-center text-sm font-medium text-ink-700 transition-colors hover:bg-cream-100"
            >
              🏠 Xem cơ sở
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}

function HoldBanner({ secondsLeft }: { secondsLeft: number }) {
  const minutes = Math.floor(secondsLeft / 60);
  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg bg-gold-50 px-4 py-3 text-sm text-gold-900 ring-1 ring-gold-200">
      <Clock className="h-4 w-4 shrink-0" />
      <span>
        Đang giữ chỗ —{' '}
        {secondsLeft > 0 ? (
          <>
            còn <strong>~{minutes} phút</strong> trước khi tự nhả phòng
          </>
        ) : (
          <strong>đã hết hạn giữ chỗ</strong>
        )}
      </span>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
      <div>
        <dt className="overline muted no-dash text-[10px]">{label}</dt>
        <dd className="mt-0.5 text-sm text-ink-900">{value}</dd>
      </div>
    </div>
  );
}

function Money({
  label,
  value,
  color = 'navy',
}: {
  label: string;
  value: string;
  color?: 'navy' | 'emerald' | 'amber';
}) {
  const colorClass: Record<string, string> = {
    navy: 'text-ink-900',
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
  };
  return (
    <div className="rounded-lg bg-cream-100 p-3">
      <p className="overline muted no-dash text-[10px]">{label}</p>
      <p className={`mt-1 text-lg font-bold ${colorClass[color]}`}>{value}</p>
    </div>
  );
}

function Meta({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-ink-500">{label}</dt>
      <dd
        className={
          'text-right text-ink-900 ' + (mono ? 'break-all font-mono text-xs' : '')
        }
      >
        {value}
      </dd>
    </div>
  );
}
