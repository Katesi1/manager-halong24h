import type {
  CreateYachtBookingInput,
  YachtBooking,
  YachtBookingFilters,
  YachtBookingPayment,
} from '@/core/entities/yacht-booking';

/** Kết quả xác nhận đơn — booking đã cập nhật + thông tin thanh toán VietQR. */
export interface ConfirmYachtBookingResult {
  booking: YachtBooking | null;
  payment: YachtBookingPayment;
}

export interface YachtBookingRepository {
  list(filters?: YachtBookingFilters): Promise<YachtBooking[]>;
  getById(id: string): Promise<YachtBooking | null>;
  /** POST /yacht-bookings — staff đặt hộ khách. */
  create(input: CreateYachtBookingInput): Promise<YachtBooking>;
  /** PATCH /yacht-bookings/:id/confirm → trả VietQR + STK gửi khách. */
  confirm(id: string): Promise<ConfirmYachtBookingResult>;
  /** PATCH /yacht-bookings/:id/paid — bỏ trống amount = thu đủ totalAmount. */
  markPaid(id: string, amount?: number): Promise<YachtBooking>;
  /** PATCH /yacht-bookings/:id/cancel — huỷ đơn chưa thanh toán. */
  cancel(id: string, reason?: string): Promise<YachtBooking>;
}
