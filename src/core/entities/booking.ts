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
 *  - no_show    (spec v1.14, status=4: khách không đến + không thanh toán —
 *               cron BE tự đánh khi CONFIRMED quá checkout 24h mà paidAt=null)
 */
export type BookingStatus =
  | 'hold'
  | 'confirmed'
  | 'paid'
  | 'cancelled'
  | 'completed'
  | 'no_show';

/** 1 dòng giá theo đêm trong breakdown BE trả về. */
export interface BookingPriceLineItem {
  date: string;
  /** 'weekday' | 'weekend' | 'holiday' — giữ string vì BE có thể đổi nhãn. */
  type: string;
  amount: number;
}

/**
 * Breakdown giá do BE tính server-side (spec §5.3, đang chờ BE ship).
 * Optional — FE chỉ hiển thị khi có, không tự dựng.
 */
export interface BookingPriceBreakdown {
  nights: number;
  lineItems: BookingPriceLineItem[];
  /** Tổng phụ thu người lớn/trẻ vượt chuẩn (đã × số đêm). */
  surcharge: number;
}

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
  /** `null` khi đơn còn HOLD — BE chưa join bảng giá (chỉ chốt khi markPaid). */
  totalPrice: VND | null;
  /** Tiền cọc CẦN thu (khách khai lúc hold, hoặc SALE nhập). KHÔNG phải đã thu. */
  deposit: VND | null;
  /**
   * Tiền THỰC đã thu (BE ghi ở `PATCH /paid`). BE sẽ default `0` sau khi fix;
   * hiện có thể `null` trước khi BE ship → FE coi như chưa thu.
   */
  paidAmount: VND | null;
  /**
   * Còn phải thu = `max(0, total − paid)`. BE trả sẵn (`remainingAmount`);
   * tolerant: FE tự tính khi BE chưa gửi.
   */
  remainingAmount: VND | null;
  /** Số người lớn (spec §5.3). `null` khi BE chưa tách — fallback `guestCount`. */
  adults: number | null;
  /** Số trẻ em (spec §5.3). Dùng để giải thích phụ thu. */
  children: number | null;
  /** Breakdown giá do BE tính (optional — chỉ có khi BE đã ship). */
  priceBreakdown?: BookingPriceBreakdown | null;
  /**
   * URL ảnh bill CK cọc khách gửi (spec §5.6, `POST /deposit-proof`). Owner
   * xem để đối chiếu trước khi bấm ghi nhận cọc. `null` khi khách chưa gửi.
   */
  depositProofUrl: string | null;
  /** Thời điểm owner xác nhận khách nhận phòng (spec §5.5). */
  checkedInAt: string | null;
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
