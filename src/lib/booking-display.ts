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
 * Tỉ lệ cọc mặc định khi BE chưa set `depositAmount` cụ thể.
 * Quy tắc nghiệp vụ FE: khách cần cọc 50% tổng để giữ phòng (BE không có field
 * này — chỉ lưu `depositAmount` khi SALE nhập tay).
 */
export const DEFAULT_DEPOSIT_RATE = 0.5;

/**
 * "Cọc cần thu" hiển thị trên UI:
 *  - BE có `depositAmount` (SALE nhập cụ thể) → dùng đúng số đó.
 *  - Không có → suy 50% tổng (khi đã có tổng). Chưa có tổng → `null`.
 */
export function requiredDeposit(
  deposit: number | null | undefined,
  total: number | null | undefined,
): number | null {
  if (deposit != null) return deposit;
  if (total != null) return Math.round(total * DEFAULT_DEPOSIT_RATE);
  return null;
}

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
 * Tạm tính tổng tiền booking từ bảng giá cơ sở khi BE chưa chốt giá
 * (`totalAmount=null` cho đơn HOLD/CONFIRMED — spec §5.3).
 *
 * Cộng giá từng đêm trong [checkIn, checkOut): đêm T6/T7/CN dùng
 * `weekendPrice` (fallback `weekdayPrice`) — cùng quy ước dow 0/5/6 với
 * pricing engine ([lib/pricing.ts]). KHÔNG tính được giá lễ/phụ thu → đây
 * là số ước lượng, UI phải ghi rõ "tạm tính". Trả `null` khi thiếu bảng
 * giá hoặc ngày không hợp lệ.
 */
export function estimateBookingTotal(
  prices: { weekdayPrice: number | null; weekendPrice: number | null },
  checkIn: string,
  checkOut: string,
): number | null {
  if (prices.weekdayPrice == null) return null;
  const start = new Date(checkIn.slice(0, 10));
  const end = new Date(checkOut.slice(0, 10));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  if (start >= end) return null;

  let total = 0;
  let nights = 0;
  const cur = new Date(start);
  while (cur < end && nights < 366) {
    const dow = cur.getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    total += isWeekend
      ? (prices.weekendPrice ?? prices.weekdayPrice)
      : prices.weekdayPrice;
    cur.setDate(cur.getDate() + 1);
    nights += 1;
  }
  return total;
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
