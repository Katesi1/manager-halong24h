import type { BookingStatus } from '@/core/entities/booking';

import { formatVND } from './format';

/** Variant hợp lệ của `<Badge>` (đồng bộ với components/ui/badge.tsx). */
export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold'
  | 'navy'
  | 'dark';

/** Nhãn tiếng Việt cho trạng thái booking — dùng chung list + detail. */
export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  hold: 'Giữ chỗ',
  confirmed: 'Chờ khách cọc',
  paid: 'Đã nhận tiền',
  cancelled: 'Đã huỷ',
  completed: 'Hoàn tất',
  no_show: 'Khách không đến',
};

/** Màu badge tương ứng từng trạng thái. */
export const BOOKING_STATUS_VARIANT: Record<BookingStatus, BadgeVariant> = {
  hold: 'gold',
  confirmed: 'warning',
  paid: 'info',
  cancelled: 'danger',
  completed: 'success',
  no_show: 'dark',
};

/**
 * Hiển thị tổng tiền booking.
 *
 * BE trả `null` cho đơn HOLD vì chưa join bảng giá (chỉ chốt giá khi markPaid).
 * Quy ước UI: `null` → "Chưa chốt giá" (KHÔNG fallback `?? 0` để tránh nhầm
 * khách đã đặt giá 0). Khác → "{n} ₫".
 */
export function formatBookingTotal(amount: number | null | undefined): string {
  return amount == null ? 'Chưa chốt giá' : formatVND(amount);
}

/**
 * Số giây còn lại của đơn HOLD cho đồng hồ đếm ngược.
 *
 * Ưu tiên `holdRemainingSeconds` (server tính tại thời điểm trả response →
 * không lệch khi đồng hồ client sai giờ). Fallback tính từ `holdExpireAt`
 * nếu BE không gửi field này.
 */
export function holdSecondsLeft(booking: {
  holdRemainingSeconds?: number;
  holdExpireAt?: string | null;
}): number {
  if (typeof booking.holdRemainingSeconds === 'number') {
    return Math.max(0, booking.holdRemainingSeconds);
  }
  if (booking.holdExpireAt) {
    const ms = new Date(booking.holdExpireAt).getTime() - Date.now();
    return Math.max(0, Math.floor(ms / 1000));
  }
  return 0;
}
