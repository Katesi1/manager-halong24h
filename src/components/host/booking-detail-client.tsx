'use client';

import Image from 'next/image';
import Link from 'next/link';

import { BookingActions } from '@/components/host/booking-actions';
import { OpenDisputeButton } from '@/components/host/open-dispute-button';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { Booking, BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import {
  formatBookingTotal,
  holdSecondsLeft,
  requiredDeposit,
} from '@/lib/booking-display';
import { formatDate, formatDateTime } from '@/lib/format';
import { useApiResource } from '@/lib/use-api-resource';

const STATUS_LABEL: Record<BookingStatus, string> = {
  hold: 'Giữ chỗ (chờ xác nhận)',
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

interface BookingDetailData {
  booking: Booking;
  estimatedTotal: number | null;
}

/**
 * Chi tiết booking fetch từ `/api/bookings/:id` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Loading/error/not-found ở client.
 */
export function BookingDetailClient({
  id,
  created,
}: {
  id: string;
  created?: boolean;
}) {
  const { loading, error, data } = useApiResource<BookingDetailData>(
    `/api/bookings/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy đặt phòng'}
      </div>
    );
  }

  const { booking, estimatedTotal } = data;
  const hasTotal = booking.totalPrice != null;
  const effectiveTotal = booking.totalPrice ?? estimatedTotal;
  // Tiền THỰC đã thu (khác cọc cần thu). Chưa thu → 0.
  const paid = booking.paidAmount ?? 0;
  // Ưu tiên remainingAmount BE trả sẵn; fallback tính từ tổng (thật hoặc tạm tính).
  const remaining =
    booking.remainingAmount != null
      ? booking.remainingAmount
      : effectiveTotal != null
        ? Math.max(0, effectiveTotal - paid)
        : null;
  const fullyPaid = hasTotal && booking.totalPrice! > 0 && paid >= booking.totalPrice!;
  // Cọc cần thu: dùng depositAmount BE set, hoặc suy 50% tổng (BE không có field này).
  const depositDue = requiredDeposit(booking.deposit, effectiveTotal);
  const depositIsEstimated = booking.deposit == null && depositDue != null;

  return (
    <>
      <PageHeader
        backHref="/host/bookings"
        backLabel="Quay lại danh sách đặt phòng"
        title={`Đặt phòng ${booking.id.slice(0, 12)}`}
        description={`Tạo lúc ${formatDateTime(booking.createdAt)}`}
        breadcrumbs={[
          { label: 'Đặt phòng', href: '/host/bookings' },
          { label: booking.id.slice(0, 12) },
        ]}
        actions={
          <Badge variant={STATUS_VARIANT[booking.status]}>
            {STATUS_LABEL[booking.status]}
          </Badge>
        }
      />

      {created && (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          ✓ Đã tạo booking thành công.
        </div>
      )}

      {booking.status === 'hold' && (
        <HoldCountdown secondsLeft={holdSecondsLeft(booking)} />
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Thông tin khách + lưu trú
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Detail label="Khách" value={booking.guestName} />
              <Detail
                label="SĐT"
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
                label="Số khách"
                value={
                  booking.adults != null
                    ? `${booking.adults} người lớn${
                        booking.children ? ` + ${booking.children} trẻ em` : ''
                      }`
                    : `${booking.guestCount} người`
                }
              />
              <Detail label="Số đêm" value={`${booking.nights} đêm`} />
              <Detail label="Nhận phòng" value={formatDate(booking.checkInAt)} />
              <Detail label="Trả phòng" value={formatDate(booking.checkOutAt)} />
            </div>
            {booking.notes && (
              <div className="mt-4 rounded-lg bg-cream-100 p-3 text-sm">
                <p className="overline muted no-dash text-[10px]">Ghi chú</p>
                <p className="mt-1 text-ink-900 whitespace-pre-line">
                  {booking.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Cơ sở
            </h2>
            <div className="mt-3">
              <Link
                href={`/host/properties/${booking.propertyId}`}
                className="font-medium text-navy-700 hover:underline"
              >
                {booking.propertyName} ↗
              </Link>
              <p className="mt-1 text-xs font-mono text-ink-500">
                {booking.propertyId}
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Thanh toán trực tiếp
              </h2>
              {fullyPaid && <Badge variant="success">Đã nhận đủ</Badge>}
            </div>
            <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
              <Stat
                label="Tổng"
                value={
                  hasTotal
                    ? formatBookingTotal(booking.totalPrice)
                    : estimatedTotal != null
                      ? `≈ ${formatVND(estimatedTotal)}`
                      : 'Chưa chốt giá'
                }
                hint={
                  !hasTotal && estimatedTotal != null
                    ? 'Tạm tính theo bảng giá — chốt khi thu tiền'
                    : undefined
                }
              />
              <Stat
                label="Cọc cần thu"
                value={
                  depositDue != null ? formatVND(depositDue) : 'Chưa chốt giá'
                }
                hint={depositIsEstimated ? '≈ 50% tổng' : undefined}
              />
              <Stat
                label="Đã thu"
                value={formatVND(paid)}
                color="emerald"
              />
              <Stat
                label="Còn lại"
                value={
                  remaining == null
                    ? 'Chưa chốt giá'
                    : hasTotal
                      ? formatVND(remaining)
                      : `≈ ${formatVND(remaining)}`
                }
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
                <p className="mt-1 text-xs text-sky-800">
                  Đối chiếu với STK của bạn trước khi bấm “Ghi nhận khách đã
                  chuyển cọc”.
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
                  Bấm ảnh để xem kích thước đầy đủ.
                </p>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-cream-100 p-4 text-sm text-ink-700">
              <p className="font-semibold text-ink-900">
                💸 Khách chuyển khoản trực tiếp cho bạn
              </p>
              <p className="mt-2 leading-relaxed">
                Halong24h KHÔNG giữ tiền. Khách chuyển vào STK đã KYC của bạn, sau
                đó upload bill lên khung chat bên dưới để bạn xác nhận. Toàn bộ
                cuộc chat + bill được lưu trên hệ thống để giải quyết khiếu nại
                nếu phát sinh.
              </p>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Trò chuyện với khách
              </h2>
              <Badge variant="default">Chứng cứ giao dịch</Badge>
            </div>
            <p className="mt-2 text-sm text-ink-700">
              Mọi tin nhắn + ảnh bill trao đổi với khách được lưu trên hệ thống.
              Nếu có khiếu nại, đội Halong24h sẽ đọc lại để ra phán quyết.
            </p>
            <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-cream-50 p-8 text-center">
              <p className="text-2xl">💬</p>
              <p className="mt-2 text-sm font-medium text-ink-900">
                Tính năng chat đang chuẩn bị
              </p>
              <p className="mt-1 text-xs text-ink-500">
                Khung chat và gửi ảnh bill trao đổi với khách sẽ sớm hiển thị ở
                đây.
              </p>
              <Link
                href={`/host/messages?booking=${booking.id}`}
                className="mt-4 inline-block text-xs font-semibold text-navy-700 hover:underline"
              >
                Mở tin nhắn →
              </Link>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
              <h3 className="overline muted no-dash text-[10px]">
                Hành động đặt phòng
              </h3>
              <div className="mt-3">
                <BookingActions
                  bookingId={booking.id}
                  status={booking.status}
                  totalPrice={effectiveTotal ?? 0}
                  alreadyPaid={paid}
                  depositDue={depositDue}
                />
              </div>
            </div>

            <Link
              href={`/host/calendar?start=${booking.checkInAt.slice(0, 10)}&property=${booking.propertyId}`}
              className="block rounded-2xl border border-ink-200 bg-white px-5 py-3 text-center text-sm font-medium text-ink-700 hover:bg-cream-100"
            >
              📅 Xem trên lịch
            </Link>

            {booking.status !== 'cancelled' && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
                <h3 className="overline muted no-dash text-[10px]">
                  Gặp vấn đề với khách?
                </h3>
                <p className="mt-2 text-xs text-ink-700 leading-relaxed">
                  Mở khiếu nại với Halong24h. Đội ngũ sẽ đọc lại chat + bill để ra
                  phán quyết trong vòng 24-48 giờ.
                </p>
                <div className="mt-3">
                  <OpenDisputeButton bookingId={booking.id} />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}

function HoldCountdown({ secondsLeft }: { secondsLeft: number }) {
  const minutes = Math.floor(secondsLeft / 60);
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3 text-sm text-gold-900 ring-1 ring-gold-200">
      <span>
        ⏳ Đặt phòng đang giữ chỗ —{' '}
        {secondsLeft > 0
          ? `còn ~${minutes} phút trước khi tự nhả phòng`
          : 'đã hết hạn giữ chỗ'}
      </span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="overline muted no-dash text-[10px]">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value}</dd>
    </div>
  );
}

function Stat({
  label,
  value,
  color = 'navy',
  hint,
}: {
  label: string;
  value: string;
  color?: 'navy' | 'emerald' | 'amber';
  hint?: string;
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
      {hint && <p className="mt-0.5 text-[11px] text-ink-500">{hint}</p>}
    </div>
  );
}
