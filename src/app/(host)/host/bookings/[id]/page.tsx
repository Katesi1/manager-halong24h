import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getBookingAction } from '@/app/actions/bookings';
import { BookingActions } from '@/components/host/booking-actions';
import { OpenDisputeButton } from '@/components/host/open-dispute-button';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { Booking, BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate, formatDateTime } from '@/lib/format';

const STATUS_LABEL: Record<BookingStatus, string> = {
  hold: 'Giữ chỗ (chờ xác nhận)',
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

export default async function BookingDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const result = await getBookingAction(id);
  if (!result.ok || result.data === null) notFound();
  const booking: Booking = result.data;

  const remaining = Math.max(0, booking.totalPrice - booking.deposit);
  const fullyPaid = remaining === 0 && booking.totalPrice > 0;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
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

      {sp.created === '1' && (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          ✓ Đã tạo booking thành công.
        </div>
      )}

      {booking.status === 'hold' && booking.holdExpireAt && (
        <HoldCountdown holdExpireAt={booking.holdExpireAt} />
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
              <Detail label="Số khách" value={`${booking.guestCount} người`} />
              <Detail label="Số đêm" value={`${booking.nights} đêm`} />
              <Detail label="Nhận phòng" value={formatDate(booking.checkInAt)} />
              <Detail label="Trả phòng" value={formatDate(booking.checkOutAt)} />
            </div>
            {booking.notes && (
              <div className="mt-4 rounded-lg bg-cream-100 p-3 text-sm">
                <p className="overline muted no-dash text-[10px]">
                  Ghi chú
                </p>
                <p className="mt-1 text-ink-900 whitespace-pre-line">
                  {booking.notes}
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">Cơ sở</h2>
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
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Stat label="Tổng" value={formatVND(booking.totalPrice)} />
              <Stat
                label="Khách đã chuyển"
                value={formatVND(booking.deposit)}
                color="emerald"
              />
              <Stat
                label="Còn lại"
                value={formatVND(remaining)}
                color={remaining > 0 ? 'amber' : 'emerald'}
              />
            </div>
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

          {/* Chat + bill placeholder */}
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
                Khi BE bổ sung endpoint conversations, khung chat + upload bill
                sẽ hiển thị ở đây.
              </p>
              <Link
                href={`/host/messages?booking=${booking.id}`}
                className="mt-4 inline-block text-xs font-semibold text-navy-700 hover:underline"
              >
                Mở tin nhắn (demo) →
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
                  totalPrice={booking.totalPrice}
                  alreadyPaid={booking.deposit}
                />
              </div>
            </div>

            <Link
              href={`/host/calendar?start=${booking.checkInAt.slice(0, 10)}&property=${booking.propertyId}`}
              className="block rounded-2xl border border-ink-200 bg-white px-5 py-3 text-center text-sm font-medium text-ink-700 hover:bg-cream-100"
            >
              📅 Xem trên lịch
            </Link>

            {/* Open dispute (owner-side) — chỉ khi không phải đặt phòng đã huỷ */}
            {booking.status !== 'cancelled' && (
              <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
                <h3 className="overline muted no-dash text-[10px]">
                  Gặp vấn đề với khách?
                </h3>
                <p className="mt-2 text-xs text-ink-700 leading-relaxed">
                  Mở khiếu nại với Halong24h. Đội ngũ sẽ đọc lại chat + bill để
                  ra phán quyết trong vòng 24-48 giờ.
                </p>
                <div className="mt-3">
                  <OpenDisputeButton bookingId={booking.id} />
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function HoldCountdown({ holdExpireAt }: { holdExpireAt: string }) {
  const remainingMs = new Date(holdExpireAt).getTime() - Date.now();
  const minutes = Math.max(0, Math.floor(remainingMs / 60_000));
  return (
    <div className="mb-6 flex items-center justify-between rounded-lg bg-gold-50 px-4 py-3 text-sm text-gold-900 ring-1 ring-gold-200">
      <span>
        ⏳ Đặt phòng đang giữ chỗ — hết hạn lúc{' '}
        <strong>{formatDateTime(holdExpireAt)}</strong>{' '}
        {minutes > 0 ? `(còn ~${minutes} phút)` : '(đã hết hạn)'}
      </span>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="overline muted no-dash text-[10px]">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-ink-900">{value}</dd>
    </div>
  );
}

function Stat({
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
      <p className="overline muted no-dash text-[10px]">
        {label}
      </p>
      <p className={`mt-1 text-lg font-bold ${colorClass[color]}`}>{value}</p>
    </div>
  );
}
