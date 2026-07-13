import type { VND } from '../value-objects/vnd';

/**
 * Đơn đặt du thuyền — spec B2 (status number 0..4, BE chốt 2026-07-13).
 *
 * Luồng: PENDING (0, khách đặt) → CONFIRMED (1, admin/SALE xác nhận + sinh VietQR)
 * → PAID (2, ghi nhận đủ tiền → BE tự gửi email mã code) → COMPLETED (3, cron tự
 * chuyển sau 12h trưa ngày kết thúc). CANCELLED (4) = huỷ đơn chưa thanh toán.
 */
export type YachtBookingStatus =
  | 'pending'
  | 'confirmed'
  | 'paid'
  | 'completed'
  | 'cancelled';

/**
 * Thông tin thanh toán trả về khi `confirm` — VietQR (chuỗi EMV `qrCode`) + STK
 * để nhân viên gửi khách. `amount` là số tiền cần chuyển (VND).
 */
export interface YachtBookingPayment {
  bankBin: string | null;
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  amount: number;
  content: string;
  /** Chuỗi EMV VietQR (BE sinh). FE render QR từ STK + amount + content. */
  qrCode: string | null;
}

export interface YachtBooking {
  id: string;
  code: string | null;
  yachtId: string;
  yachtName: string;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  /** Ngày khởi hành. */
  checkInAt: string;
  /** Ngày kết thúc (tour nhiều ngày). `null` với tour trong ngày. */
  checkOutAt: string | null;
  nights: number | null;
  adults: number | null;
  children: number | null;
  guestCount: number;
  status: YachtBookingStatus;
  totalAmount: VND | null;
  paidAmount: VND | null;
  remainingAmount: VND | null;
  paidAt: string | null;
  confirmedAt: string | null;
  cancelledReason: string | null;
  /** Khách đã đánh giá đơn này chưa (spec §review). */
  hasReview: boolean;
  /** Mốc mở đánh giá (checkout + 12h trưa VN). */
  reviewUnlockAt: string | null;
  /** Khách đủ điều kiện đánh giá (đã thanh toán/hoàn tất + qua mốc + chưa đánh giá). */
  canReview: boolean;
  /**
   * Thông tin thanh toán VietQR + STK — BE trả sẵn trong `GET /yacht-bookings/:id`
   * khi đơn CONFIRMED + chưa trả (v1.40.2). `null` ở trạng thái khác.
   */
  payment: YachtBookingPayment | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface YachtBookingFilters {
  status?: YachtBookingStatus;
  page?: number;
  limit?: number;
}

/** POST /yacht-bookings — staff đặt hộ khách. */
export interface CreateYachtBookingInput {
  yachtId: string;
  /** Optional — cho khách đã có tài khoản. */
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  checkInAt: string;
  checkOutAt?: string;
  adults: number;
  children?: number;
  notes?: string;
}
