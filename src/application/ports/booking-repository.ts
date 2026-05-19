import type {
  Booking,
  BookingFilters,
  CancelBookingInput,
  CreateBookingHoldInput,
} from '@/core/entities/booking';

export interface BookingRepository {
  list(filters?: BookingFilters): Promise<Booking[]>;
  getById(id: string): Promise<Booking | null>;
  /** POST /bookings/hold — staff hold 30 phút */
  hold(input: CreateBookingHoldInput): Promise<Booking>;
  /** PATCH /bookings/:id/confirm — chủ xác nhận có phòng, gửi email TT */
  confirm(id: string): Promise<Booking>;
  /**
   * PATCH /bookings/:id/mark-paid — chủ xác nhận đã nhận tiền.
   *
   * Nếu `amount` >= totalPrice → status = paid + auto gửi Email 2.
   * Nếu `amount` < totalPrice → cộng dồn vào deposit, vẫn confirmed.
   * Nếu không truyền `amount` → giả định khách đã chuyển đủ.
   */
  markPaid(id: string, amount?: number): Promise<Booking>;
  /** PATCH /bookings/:id/cancel */
  cancel(input: CancelBookingInput): Promise<Booking>;
}
