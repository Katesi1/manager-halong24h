/**
 * Payment Session — spec v1.6 §10.3 (Manual reconcile flow).
 *
 * Khi user trong app gọi `POST /payments/initiate` → tạo session 24h chứa
 * QR + nội dung CK. Admin đối soát qua app banking → mark-paid session.
 */

export type PaymentSessionStatus =
  | 'pending'
  | 'paid'
  | 'expired'
  | 'failed'
  | 'refunded';

export interface PaymentSession {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planId: string;
  cycle: 'monthly' | 'yearly';
  rooms: number;
  totalAmount: number;
  method: 'bank_transfer';
  status: PaymentSessionStatus;
  /** Nội dung chuyển khoản chuẩn — "HALONG24H <sessionId>". */
  ckContent: string;
  /** ISO date — TTL 24h từ createdAt (spec v1.6). */
  expiresAt: string;
  /** Lúc admin xác nhận đã nhận tiền (nếu paid). */
  paidAt: string | null;
  /** Ref mà admin nhập khi mark-paid (FT26...). */
  reference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentSessionFilters {
  status?: PaymentSessionStatus;
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MarkSessionPaidInput {
  sessionId: string;
  /** Tham chiếu giao dịch ngân hàng. */
  reference?: string;
}

export const PAYMENT_SESSION_STATUS_LABEL: Record<
  PaymentSessionStatus,
  string
> = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  expired: 'Hết hạn',
  failed: 'Thất bại',
  refunded: 'Đã hoàn',
};

/**
 * Session đã hết hạn (về mặt nghiệp vụ) hay chưa.
 *
 * BE không có cron tự flip `pending → expired` đúng mốc TTL 24h, nên một session
 * quá `expiresAt` vẫn có thể mang `status: 'pending'`. Khi đó admin KHÔNG được
 * xác nhận đã nhận tiền (subscription đã đóng phía BE/app). Hàm này coi như hết
 * hạn nếu: status đã là `expired`, HOẶC còn `pending` nhưng đã quá `expiresAt`.
 *
 * `now` cho phép inject để test; mặc định `Date.now()`.
 */
export function isPaymentSessionExpired(
  session: Pick<PaymentSession, 'status' | 'expiresAt'>,
  now: number = Date.now(),
): boolean {
  if (session.status === 'expired') return true;
  if (session.status !== 'pending') return false;
  const expiresAtMs = Date.parse(session.expiresAt);
  return Number.isFinite(expiresAtMs) && expiresAtMs < now;
}

/** Session còn xác nhận thanh toán được: đang `pending` VÀ chưa quá TTL. */
export function isPaymentSessionActionable(
  session: Pick<PaymentSession, 'status' | 'expiresAt'>,
  now: number = Date.now(),
): boolean {
  return session.status === 'pending' && !isPaymentSessionExpired(session, now);
}
