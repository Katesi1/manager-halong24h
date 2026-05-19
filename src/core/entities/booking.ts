import type { VND } from '../value-objects/vnd';

/**
 * Booking — spec §11.4.
 *
 * Status (BE thường trả uppercase, FE chuẩn hoá về lowercase):
 *  - hold       (đang giữ chỗ — staff 30 phút, customer 24h)
 *  - confirmed  (chủ nhà đã xác nhận có phòng + đã gửi email hướng dẫn TT, chờ khách chuyển)
 *  - paid       (chủ nhà đã nhận tiền + gửi email phiếu check-in)
 *  - cancelled  (huỷ)
 *  - completed  (đã check-out, hoàn thành)
 */
export type BookingStatus =
  | 'hold'
  | 'confirmed'
  | 'paid'
  | 'cancelled'
  | 'completed';

export interface Booking {
  id: string;
  propertyId: string;
  propertyName: string;
  saleId?: string | null;
  customerId?: string | null;
  guestName: string;
  guestPhone: string | null;
  guestCount: number;
  checkInAt: string;
  checkOutAt: string;
  nights: number;
  status: BookingStatus;
  totalPrice: VND;
  deposit: VND;
  /** Khi status = hold: thời điểm hết hạn giữ chỗ */
  holdExpireAt?: string | null;
  /** Tính từ thời điểm fetch */
  holdRemainingSeconds?: number;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  propertyId?: string;
  from?: string;
  to?: string;
}

/** Input để staff/host hold booking walk-in 30 phút (POST /bookings/hold) */
export interface CreateBookingHoldInput {
  propertyId: string;
  guestName: string;
  guestPhone: string;
  checkInAt: string;
  checkOutAt: string;
  guestCount: number;
  depositAmount?: number;
  notes?: string;
}

/** Cancel reason (optional, BE chỉ cần body có {reason?: string}) */
export interface CancelBookingInput {
  id: string;
  reason?: string;
}
