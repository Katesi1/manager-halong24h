import type {
  Booking,
  BookingFilters,
  CancelBookingInput,
  CreateBookingHoldInput,
} from '@/core/entities/booking';

export interface UpdateBookingInput {
  id: string;
  customerName?: string;
  customerPhone?: string;
  guestCount?: number;
  notes?: string;
  depositAmount?: number;
}

export interface PropertyMonthCalendarFilters {
  propertyId: string;
  year: number;
  month: number;
}

export interface BookingRepository {
  list(filters?: BookingFilters): Promise<Booking[]>;
  getById(id: string): Promise<Booking | null>;
  /** Spec §5.1 — GET /bookings/my-bookings (CUSTOMER xem booking của mình). */
  listMine(filters?: BookingFilters): Promise<Booking[]>;
  /** Spec §5.1 — GET /bookings/calendar/:propertyId?year&month. */
  monthCalendar(filters: PropertyMonthCalendarFilters): Promise<Booking[]>;
  /** Spec §5.1 — POST /bookings/hold (staff 30 phút). */
  hold(input: CreateBookingHoldInput): Promise<Booking>;
  /** Spec §5.1 — POST /bookings/customer-hold (CUSTOMER 24h). */
  customerHold(input: CreateBookingHoldInput): Promise<Booking>;
  /** Spec §5.1 — PATCH /bookings/:id/confirm. */
  confirm(id: string): Promise<Booking>;
  /**
   * Spec §5.1 — PATCH /bookings/:id/paid (đổi từ /mark-paid trong v1.2).
   * Nếu booking đang HOLD → tự chuyển CONFIRMED.
   */
  markPaid(id: string, amount?: number): Promise<Booking>;
  /**
   * Spec §5.5 (v1.31) — PATCH /bookings/:id/checkin. Xác nhận khách nhận phòng
   * + thu nốt (`amount` cộng dồn vào paidAmount; bỏ trống = thu đủ) → COMPLETED.
   * Yêu cầu booking CONFIRMED.
   */
  checkin(id: string, amount?: number): Promise<Booking>;
  /** Spec §5.1 — PATCH /bookings/:id/cancel (ADMIN/OWNER/SALE). */
  cancel(input: CancelBookingInput): Promise<Booking>;
  /** Spec §5.1 — PATCH /bookings/:id/customer-cancel (Customer huỷ HOLD). */
  customerCancel(id: string): Promise<Booking>;
  /** Spec §5.1 — PUT /bookings/:id (ADMIN/OWNER/SALE update). */
  update(input: UpdateBookingInput): Promise<Booking>;
}
