'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';

import {
  cancelYachtBookingAction,
  confirmYachtBookingAction,
  markYachtBookingPaidAction,
} from '@/app/actions/yacht-bookings';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Input, Label } from '@/components/ui/input';
import { QrCode } from '@/components/ui/qr-code';
import { toast } from '@/components/ui/toast';
import type { YachtBooking, YachtBookingPayment } from '@/core/entities/yacht-booking';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate, formatDateTime } from '@/lib/format';
import { vietQRImageUrlFor } from '@/lib/vietqr';
import { refetchApiResources, useApiResource } from '@/lib/use-api-resource';
import {
  YACHT_BOOKING_STATUS_LABEL,
  YACHT_BOOKING_STATUS_VARIANT,
} from '@/lib/yacht-display';

export function YachtBookingDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<YachtBooking>(`/api/admin/yacht-bookings/${id}`);
  const [payment, setPayment] = useState<YachtBookingPayment | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [amount, setAmount] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [pending, startTransition] = useTransition();

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        {error ?? 'Không tìm thấy đơn'}
      </div>
    );
  }

  const b = data;
  // BE trả sẵn `payment` trong GET khi đơn CONFIRMED + chưa trả (v1.40.2) →
  // hiện QR/STK ngay, không cần bấm lại. Ưu tiên payment vừa confirm (nếu có).
  const displayPayment = payment ?? b.payment;
  const isSameDay =
    !b.checkOutAt || b.checkOutAt.slice(0, 10) === b.checkInAt.slice(0, 10);

  function doConfirm() {
    startTransition(async () => {
      const res = await confirmYachtBookingAction(b.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setPayment(res.data.payment);
      toast.success('Đã xác nhận — gửi thông tin thanh toán cho khách');
      refetchApiResources();
    });
  }

  function doPaid() {
    const amt = amount.trim() ? Number(amount) : undefined;
    if (amt !== undefined && (!Number.isFinite(amt) || amt <= 0)) {
      toast.error('Số tiền không hợp lệ');
      return;
    }
    startTransition(async () => {
      const res = await markYachtBookingPaidAction(b.id, amt);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setShowPaid(false);
      setPayment(null);
      toast.success('Đã ghi nhận thanh toán — hệ thống gửi email mã code cho khách');
      refetchApiResources();
    });
  }

  function doCancel() {
    setConfirmCancel(false);
    startTransition(async () => {
      const res = await cancelYachtBookingAction(b.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Đã huỷ đơn');
      refetchApiResources();
    });
  }

  const canConfirm = b.status === 'pending';
  const canPaid = b.status === 'confirmed';
  const canCancel = b.status === 'pending' || b.status === 'confirmed';

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold text-navy-900">Thông tin đơn</h2>
            <div className="flex items-center gap-2">
              {(b.status === 'paid' || b.status === 'completed') && (
                <span
                  className={
                    'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ' +
                    (b.hasReview
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      : 'bg-ink-100 text-ink-500 ring-ink-200')
                  }
                >
                  {b.hasReview ? '★ Đã đánh giá' : 'Chưa đánh giá'}
                </span>
              )}
              <span className={'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ' + YACHT_BOOKING_STATUS_VARIANT[b.status]}>
                {YACHT_BOOKING_STATUS_LABEL[b.status]}
              </span>
            </div>
          </div>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <Info label="Khách hàng" value={b.customerName || '—'} />
            <Info label="Số điện thoại" value={b.customerPhone ?? '—'} />
            <Info label="Email" value={b.customerEmail ?? '—'} />
            <Info label="Tour (du thuyền)" value={b.yachtName || '—'} />
            <Info label="Ngày đi tour" value={formatDate(b.checkInAt)} />
            {!isSameDay && (
              <Info label="Ngày kết thúc" value={formatDate(b.checkOutAt)} />
            )}
            <Info label="Số khách" value={`${b.guestCount}${b.adults != null ? ` (${b.adults} NL${b.children ? ` + ${b.children} TE` : ''})` : ''}`} />
            <Info label="Mã đơn" value={b.code ?? b.id.slice(0, 8)} />
          </dl>
          {b.notes && (
            <div className="mt-4 rounded-lg bg-cream-100 px-4 py-3 text-sm text-ink-700">
              <span className="font-medium">Ghi chú: </span>
              {b.notes}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
          <h2 className="mb-4 font-display text-lg font-semibold text-navy-900">Thanh toán</h2>
          <div className="grid grid-cols-3 gap-4">
            <Money label="Tổng tiền" value={formatVND(b.totalAmount)} />
            <Money label="Đã thu" value={formatVND(b.paidAmount)} />
            <Money label="Còn lại" value={formatVND(b.remainingAmount)} />
          </div>
          {(b.status === 'paid' || b.status === 'completed') && b.code && (
            <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              <span className="font-medium">Mã code đã gửi khách qua email: </span>
              <span className="font-mono font-bold">{b.code}</span>
            </div>
          )}
        </div>

        {displayPayment && <PaymentCard payment={displayPayment} />}
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-ink-200/60">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-500">Thao tác</h3>
          <div className="space-y-2">
            {canConfirm && (
              <Button onClick={doConfirm} disabled={pending} className="w-full">
                Xác nhận & tạo VietQR
              </Button>
            )}
            {canPaid && !displayPayment && (
              <Button variant="outline" onClick={doConfirm} disabled={pending} className="w-full">
                Hiển thị lại VietQR / STK
              </Button>
            )}
            {canPaid && !showPaid && (
              <Button variant="gold" onClick={() => setShowPaid(true)} disabled={pending} className="w-full">
                Ghi nhận đã thanh toán
              </Button>
            )}
            {canPaid && showPaid && (
              <div className="rounded-lg border border-ink-200 p-3">
                <Label>Số tiền thực nhận (₫)</Label>
                <Input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Để trống = thu đủ ${formatVND(b.remainingAmount ?? b.totalAmount)}`}
                />
                <div className="mt-2 flex gap-2">
                  <Button variant="gold" size="sm" onClick={doPaid} disabled={pending}>
                    Xác nhận
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowPaid(false)} disabled={pending}>
                    Huỷ
                  </Button>
                </div>
              </div>
            )}
            {canCancel && (
              <Button variant="danger" onClick={() => setConfirmCancel(true)} disabled={pending} className="w-full">
                Huỷ đơn
              </Button>
            )}
            {b.status === 'paid' && <p className="text-sm text-ink-500">Đã thanh toán. Đơn sẽ tự chuyển “Hoàn tất” sau ngày kết thúc hành trình.</p>}
            {b.status === 'completed' && <p className="text-sm text-ink-500">Đơn đã hoàn tất.</p>}
            {b.status === 'cancelled' && (
              <p className="text-sm text-ink-500">
                Đơn đã huỷ{b.cancelledReason ? `: ${b.cancelledReason}` : '.'}
              </p>
            )}
          </div>
        </div>
        <p className="px-1 text-xs text-ink-400">Tạo lúc {formatDateTime(b.createdAt)}</p>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        title="Huỷ đơn này?"
        description="Chỉ huỷ được đơn chưa thanh toán. Thao tác không thể hoàn tác."
        confirmLabel="Huỷ đơn"
        variant="danger"
        pending={pending}
        onConfirm={doCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="text-sm font-medium text-ink-900">{value}</dd>
    </div>
  );
}

function Money({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream-100 px-3 py-2.5">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 font-semibold text-navy-900">{value}</p>
    </div>
  );
}

function PaymentCard({ payment }: { payment: YachtBookingPayment }) {
  const [copied, setCopied] = useState(false);
  // Ưu tiên render chuỗi EMV BE trả (khớp CRC/nội dung sanitize); fallback
  // img.vietqr.io khi BE chưa trả qrCode.
  const fallbackUrl = payment.qrCode
    ? null
    : vietQRImageUrlFor({
        bankBin: payment.bankBin,
        accountNumber: payment.accountNumber,
        accountName: payment.accountName,
        amount: payment.amount,
        memo: payment.content,
      });

  function copy() {
    navigator.clipboard?.writeText(payment.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-sky-200">
      <h2 className="mb-1 font-display text-lg font-semibold text-navy-900">Thông tin chuyển khoản</h2>
      <p className="mb-4 text-xs text-ink-500">Gửi cho khách để chuyển khoản. Sau khi nhận đủ tiền, bấm “Ghi nhận đã thanh toán”.</p>
      {!payment.accountNumber ? (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          Chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ quản trị hệ thống.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
          {payment.qrCode ? (
            <div className="mx-auto rounded-lg ring-1 ring-ink-200">
              <QrCode value={payment.qrCode} size={180} className="rounded-lg" />
            </div>
          ) : fallbackUrl ? (
            <div className="mx-auto">
              <Image src={fallbackUrl} alt="VietQR" width={180} height={180} unoptimized className="rounded-lg ring-1 ring-ink-200" />
            </div>
          ) : null}
          <dl className="space-y-2 text-sm">
            <Row label="Ngân hàng" value={payment.bankName ?? payment.bankBin ?? '—'} />
            <Row label="Số tài khoản" value={payment.accountNumber} />
            <Row label="Chủ tài khoản" value={payment.accountName ?? '—'} />
            <Row label="Số tiền" value={formatVND(payment.amount)} />
            <div>
              <dt className="text-xs text-ink-500">Nội dung chuyển khoản</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <code className="rounded bg-cream-100 px-2 py-1 font-mono text-sm font-semibold text-navy-900">{payment.content}</code>
                <button type="button" onClick={copy} className="text-xs font-semibold text-navy-700 hover:underline">
                  {copied ? 'Đã copy' : 'Copy'}
                </button>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="font-medium text-ink-900">{value}</dd>
    </div>
  );
}
