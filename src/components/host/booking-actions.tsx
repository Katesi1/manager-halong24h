'use client';

import { useEffect, useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  cancelBookingAction,
  confirmBookingAction,
  markBookingPaidAction,
} from '@/app/actions/bookings';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import type { BookingStatus } from '@/core/entities/booking';
import { formatVND } from '@/core/value-objects/vnd';

interface Props {
  bookingId: string;
  status: BookingStatus;
  totalPrice: number;
  alreadyPaid: number;
}

/**
 * Actions cho 1 booking:
 *  - hold       → "Xác nhận có phòng + gửi email" (1 bước, auto email)
 *  - confirmed  → "Xác nhận đã nhận tiền" (hỗ trợ partial)
 *  - paid       → readonly (vẫn cho phép Hủy, có cảnh báo R3)
 *  - cancelled/completed → readonly
 *  - Hủy: available ở hold / confirmed / paid (theo R3, 3-tier penalty)
 */
export function BookingActions({
  bookingId,
  status,
  totalPrice,
  alreadyPaid,
}: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [acceptResponsibility, setAcceptResponsibility] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canCancel =
    status === 'hold' || status === 'confirmed' || status === 'paid';

  const remaining = Math.max(0, totalPrice - alreadyPaid);

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const r = await confirmBookingAction(bookingId);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      show(
        '✓ Đã xác nhận · Email hướng dẫn thanh toán đã gửi cho khách',
        'success',
      );
      router.refresh();
    });
  }

  function onMarkPaid() {
    setError(null);
    const amount = paymentAmount ? Number(paymentAmount) : remaining;
    if (amount <= 0) {
      setError('Số tiền phải > 0');
      return;
    }
    if (amount > remaining + 1000) {
      setError(`Số tiền vượt quá còn lại (${formatVND(remaining)})`);
      return;
    }
    startTransition(async () => {
      const r = await markBookingPaidAction(bookingId, amount);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      const willCompletePay = alreadyPaid + amount >= totalPrice;
      show(
        willCompletePay
          ? '✓ Đã nhận đủ · Email phiếu check-in đã gửi cho khách'
          : `✓ Đã ghi nhận ${formatVND(amount)} · Vẫn còn chờ ${formatVND(remaining - amount)}`,
        'success',
      );
      setShowMarkPaid(false);
      setPaymentAmount('');
      router.refresh();
    });
  }

  function onCancel() {
    setError(null);
    const trimmedReason = cancelReason.trim();
    // Hold: lý do từ chối bắt buộc (gửi cho khách)
    // Confirmed/Paid: lý do bắt buộc
    if (!trimmedReason) {
      setError(
        status === 'hold'
          ? 'Vui lòng nhập lý do từ chối để gửi cho khách'
          : 'Vui lòng nhập lý do hủy',
      );
      return;
    }
    if (trimmedReason.length < 10) {
      setError('Lý do cần ít nhất 10 ký tự');
      return;
    }
    if (trimmedReason.length > 1000) {
      setError('Lý do tối đa 1000 ký tự');
      return;
    }
    if (status === 'paid' && !acceptResponsibility) {
      setError('Vui lòng xác nhận đã đọc các hậu quả trước khi hủy');
      return;
    }
    startTransition(async () => {
      const r = await cancelBookingAction(bookingId, trimmedReason);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      if (status === 'paid') {
        show(
          'Đã ghi nhận yêu cầu hủy. Hệ thống sẽ xử lý quy trình hoàn tiền + bồi thường.',
          'warning',
        );
      } else if (status === 'hold') {
        show('✓ Đã từ chối yêu cầu · Khách đã được thông báo', 'success');
      } else {
        show('✓ Đã huỷ đặt phòng', 'success');
      }
      setShowCancel(false);
      setCancelReason('');
      setAcceptResponsibility(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      )}

      {/* hold → confirm with auto email */}
      {status === 'hold' && (
        <Button onClick={onConfirm} disabled={pending} className="w-full">
          {pending ? 'Đang xác nhận…' : '✓ Xác nhận + gửi email cho khách'}
        </Button>
      )}

      {/* confirmed → markPaid (partial supported) */}
      {status === 'confirmed' && !showMarkPaid && (
        <>
          <Button
            onClick={() => {
              setShowMarkPaid(true);
              setPaymentAmount(String(remaining));
            }}
            disabled={pending}
            className="w-full"
          >
            💰 Ghi nhận khách đã chuyển khoản
          </Button>
          <p className="text-[11px] text-ink-500 text-center">
            Khách còn cần chuyển: <strong>{formatVND(remaining)}</strong>
          </p>
        </>
      )}

      {showMarkPaid && (
        <div className="space-y-3 rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <p className="text-xs text-emerald-900 leading-relaxed">
            Nhập số tiền khách vừa chuyển. Nếu = số còn lại{' '}
            <strong>{formatVND(remaining)}</strong>, hệ thống sẽ chuyển sang{' '}
            <strong>Đã nhận tiền</strong> và gửi email phiếu check-in cho khách.
          </p>
          <div>
            <Label htmlFor="payment_amount">Số tiền (VNĐ)</Label>
            <Input
              id="payment_amount"
              type="number"
              min={1}
              max={remaining}
              step={100000}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={String(remaining)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onMarkPaid}
              disabled={pending}
              className="flex-1"
            >
              {pending ? 'Đang ghi nhận…' : 'Xác nhận'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowMarkPaid(false);
                setPaymentAmount('');
                setError(null);
              }}
              disabled={pending}
            >
              Huỷ
            </Button>
          </div>
        </div>
      )}

      {/* paid → vẫn hiển thị trạng thái đã nhận đủ (action Hủy nằm bên dưới) */}
      {status === 'paid' && !showCancel && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
          ✓ Đã nhận đủ · Phiếu check-in đã gửi
        </p>
      )}

      {/* Cancel — available ở hold / confirmed / paid (R3 3-tier policy) */}
      {canCancel && (
        <>
          {!showCancel ? (
            <Button
              variant="outline"
              onClick={() => {
                setShowCancel(true);
                setError(null);
              }}
              disabled={pending}
              className="w-full"
            >
              {status === 'hold' ? 'Từ chối yêu cầu' : 'Huỷ đặt phòng'}
            </Button>
          ) : (
            <CancelPenaltyPreview
              status={status}
              reason={cancelReason}
              onReasonChange={setCancelReason}
              acceptResponsibility={acceptResponsibility}
              onAcceptChange={setAcceptResponsibility}
              pending={pending}
              onConfirm={onCancel}
              onBack={() => {
                setShowCancel(false);
                setCancelReason('');
                setAcceptResponsibility(false);
                setError(null);
              }}
            />
          )}
        </>
      )}

      {status === 'cancelled' && (
        <p className="text-center text-sm text-ink-500 py-2">Đã huỷ</p>
      )}

      {status === 'completed' && (
        <p className="text-center text-sm text-emerald-700 py-2">
          ✓ Đã hoàn tất
        </p>
      )}
    </div>
  );
}

interface CancelPenaltyPreviewProps {
  status: BookingStatus;
  reason: string;
  onReasonChange: (v: string) => void;
  acceptResponsibility: boolean;
  onAcceptChange: (v: boolean) => void;
  pending: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

/**
 * Modal nội tuyến cảnh báo penalty theo R3 (3-tier):
 *  - hold       → từ chối yêu cầu (không penalty, ảnh hưởng decline rate)
 *  - confirmed  → cảnh báo vàng (visibility, review xấu)
 *  - paid       → cảnh báo đỏ NGHIÊM TRỌNG (hoàn 100% + bồi thường 30% + block 7 ngày)
 */
function CancelPenaltyPreview({
  status,
  reason,
  onReasonChange,
  acceptResponsibility,
  onAcceptChange,
  pending,
  onConfirm,
  onBack,
}: CancelPenaltyPreviewProps) {
  const titleId = useId();
  const reasonLen = reason.trim().length;
  const reasonOk = reasonLen >= 10;
  const helperClass =
    reasonLen < 10 ? 'mt-1 text-[11px] text-red-600' : 'mt-1 text-[11px] text-ink-500';
  const containerRef = useRef<HTMLDivElement>(null);

  // Escape closes the inline dialog; focus the container on mount for a11y.
  useEffect(() => {
    const node = containerRef.current;
    if (node) {
      // Focus container so screen readers announce role=dialog + aria-labelledby.
      node.focus();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !pending) {
        e.preventDefault();
        onBack();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack, pending]);

  if (status === 'hold') {
    return (
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="space-y-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-200 focus:outline-none"
      >
        <div>
          <h4 id={titleId} className="text-sm font-semibold text-amber-900">
            Từ chối yêu cầu
          </h4>
          <ul className="mt-2 space-y-1 text-xs text-amber-900 leading-relaxed">
            <li>
              • Khách sẽ được thông báo ngay. Slot sẽ được mở lại cho lần đặt
              khác.
            </li>
            <li>
              • Phản hồi nhanh giúp tăng visibility. Tỉ lệ từ chối &gt; 40% có
              thể giảm hiển thị của bạn.
            </li>
          </ul>
        </div>
        <div>
          <Label htmlFor="cancel_reason" required>
            Lý do từ chối (sẽ gửi cho khách)
          </Label>
          <Textarea
            id="cancel_reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            placeholder="VD: Phòng đã có khách khác, chủ nhà bận đột xuất…"
            maxLength={1000}
            aria-invalid={!reasonOk}
          />
          <p className={helperClass}>
            {reasonLen}/10 ký tự tối thiểu (tối đa 1000)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="gold"
            onClick={onConfirm}
            disabled={pending || !reasonOk}
            className="flex-1"
          >
            {pending ? 'Đang gửi…' : 'Từ chối yêu cầu'}
          </Button>
          <Button variant="ghost" onClick={onBack} disabled={pending}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="space-y-3 rounded-lg bg-amber-50 p-3 ring-1 ring-amber-300 focus:outline-none"
      >
        <div>
          <h4 id={titleId} className="text-sm font-semibold text-amber-900">
            Hủy đặt phòng đã đồng ý
          </h4>
          <p className="mt-2 text-xs font-semibold text-amber-900">
            ⚠️ Bạn đang hủy SAU khi đã đồng ý booking. Hậu quả:
          </p>
          <ul className="mt-1 space-y-1 text-xs text-amber-900 leading-relaxed">
            <li>• Khách sẽ được thông báo và có thể đánh giá thấp</li>
            <li>• Tỉ lệ hủy cao có thể giảm visibility của cơ sở</li>
            <li>• Trường hợp nhiều lần, admin có thể can thiệp</li>
          </ul>
        </div>
        <div>
          <Label htmlFor="cancel_reason" required>
            Lý do hủy
          </Label>
          <Textarea
            id="cancel_reason"
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            rows={3}
            placeholder="Mô tả lý do hủy…"
            maxLength={1000}
            aria-invalid={!reasonOk}
          />
          <p className={helperClass}>
            {reasonLen}/10 ký tự tối thiểu (tối đa 1000)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={pending || !reasonOk}
            className="flex-1"
          >
            {pending ? 'Đang hủy…' : 'Tôi hiểu, vẫn hủy'}
          </Button>
          <Button variant="ghost" onClick={onBack} disabled={pending}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  // status === 'paid' — case CRITICAL theo R3
  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="space-y-3 rounded-lg bg-red-50 p-3 ring-2 ring-red-300 focus:outline-none"
    >
      <div>
        <h4 id={titleId} className="text-sm font-bold text-red-900">
          Hủy đặt phòng đã nhận cọc
        </h4>
        <p className="mt-2 text-xs font-bold uppercase text-red-700">
          🚨 Cảnh báo nghiêm trọng
        </p>
        <p className="mt-1 text-xs text-red-900 leading-relaxed">
          Khách đã chuyển cọc cho bạn. Hủy lúc này sẽ phát sinh:
        </p>
        <ul className="mt-1 space-y-1 text-xs text-red-900 leading-relaxed">
          <li>
            • Bạn <strong>PHẢI hoàn 100% cọc</strong> cho khách trong 48 giờ
          </li>
          <li>
            • <strong>Bồi thường thêm 30%</strong> giá trị cọc cho khách
          </li>
          <li>
            • Cơ sở bị <strong>tạm khóa hiển thị 7 ngày</strong>
          </li>
          <li>• Cảnh báo công khai trên hồ sơ của bạn</li>
        </ul>
        <p className="mt-2 text-xs text-red-900 leading-relaxed">
          Nếu bạn vẫn muốn hủy, vui lòng ghi rõ lý do.
        </p>
      </div>
      <div>
        <Label htmlFor="cancel_reason" required>
          Lý do hủy (chi tiết, sẽ được admin xem xét)
        </Label>
        <Textarea
          id="cancel_reason"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={4}
          placeholder="Mô tả chi tiết lý do hủy…"
          maxLength={1000}
          aria-invalid={!reasonOk}
        />
        <p className={helperClass}>
          {reasonLen}/10 ký tự tối thiểu (tối đa 1000)
        </p>
      </div>
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={acceptResponsibility}
          onChange={(e) => onAcceptChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-red-400 text-red-600 focus:ring-red-500"
        />
        <span className="text-xs font-medium text-red-900 leading-relaxed">
          Tôi xác nhận đã đọc các hậu quả và đồng ý chịu trách nhiệm
        </span>
      </label>
      <div className="flex gap-2">
        <Button
          variant="danger"
          onClick={onConfirm}
          disabled={pending || !acceptResponsibility || !reasonOk}
          className="flex-1"
        >
          {pending ? 'Đang xử lý…' : 'Tôi đồng ý hủy và chịu trách nhiệm'}
        </Button>
        <Button variant="ghost" onClick={onBack} disabled={pending}>
          Quay lại
        </Button>
      </div>
      <p className="text-center text-[11px] text-red-700">
        Tham khảo:{' '}
        <a
          href="/help/host-cancellation-policy"
          className="underline hover:text-red-900"
        >
          /help/host-cancellation-policy
        </a>
      </p>
    </div>
  );
}
