import 'server-only';

import type {
  Booking,
  BookingFilters,
  BookingPriceBreakdown,
  BookingStatus,
  CancelBookingInput,
  CreateBookingHoldInput,
} from '@/core/entities/booking';
import { vnd, type VND } from '@/core/value-objects/vnd';
import type {
  BookingRepository,
  PropertyMonthCalendarFilters,
  UpdateBookingInput,
} from '@/application/ports/booking-repository';

import { apiClient } from '../http/api-client';

/** Spec §5.3 — BE booking shape. */
interface SpecBooking {
  id: string;
  propertyId: string;
  propertyName?: string;
  saleId?: string | null;
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  adults?: number | null;
  children?: number | null;
  checkinDate: string;
  checkoutDate: string;
  nights?: number;
  status: number | BookingStatus;
  holdExpireAt?: string | null;
  holdRemainingSeconds?: number;
  depositAmount: number | null;
  totalAmount: number | null;
  paidAmount?: number | null;
  /** BE (đang chờ ship) sẽ trả sẵn `max(0, total − paid)`. */
  remainingAmount?: number | null;
  /** Breakdown giá server-side (đang chờ BE ship). */
  priceBreakdown?: {
    nights?: number;
    lineItems?: { date: string; type: string; amount: number }[];
    surcharge?: number;
  } | null;
  paidAt?: string | null;
  /** Ảnh bill CK cọc khách gửi (spec §5.6, v1.31). */
  depositProofUrl?: string | null;
  /** Thời điểm owner xác nhận nhận phòng (spec §5.5, v1.31). */
  checkedInAt?: string | null;
  guestCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt?: string;
}

/** Spec §5.3 numeric status → local string union. */
const STATUS_MAP: Record<number, BookingStatus> = {
  0: 'hold',
  1: 'confirmed',
  2: 'cancelled',
  3: 'completed',
  4: 'no_show',
};

function mapStatus(s: SpecBooking['status']): BookingStatus {
  if (typeof s === 'number') return STATUS_MAP[s] ?? 'hold';
  return s;
}

function nightsBetween(checkin: string, checkout: string): number {
  const ms = new Date(checkout).getTime() - new Date(checkin).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}

function mapBreakdown(
  raw: SpecBooking['priceBreakdown'],
): BookingPriceBreakdown | null {
  if (!raw || !Array.isArray(raw.lineItems)) return null;
  return {
    nights: raw.nights ?? raw.lineItems.length,
    lineItems: raw.lineItems.map((li) => ({
      date: li.date,
      type: li.type,
      amount: li.amount,
    })),
    surcharge: raw.surcharge ?? 0,
  };
}

function mapBooking(s: SpecBooking): Booking {
  const status = mapStatus(s.status);
  // Chỉ promote sang `paid` khi BE đã đánh dấu `paidAt`. Tránh edge case
  // totalAmount=0 (free booking) → (paidAmount ?? 0) >= 0 luôn true sẽ
  // hiển thị sai trạng thái khi user chưa thanh toán.
  const isPaid = s.paidAt != null;
  // BE trả null cho đơn HOLD (chưa chốt giá) → giữ null, UI hiện "Chưa chốt giá".
  const totalPrice = s.totalAmount == null ? null : vnd(s.totalAmount);
  // `paidAmount` = tiền THỰC đã thu (khác depositAmount = cần thu). BE hiện có
  // thể trả null trước khi fix → giữ null (UI coi như chưa thu).
  const paidAmount = s.paidAmount == null ? null : vnd(s.paidAmount);
  // Ưu tiên `remainingAmount` BE trả sẵn; nếu chưa có mà biết total → tự tính.
  let remainingAmount: VND | null = null;
  if (s.remainingAmount != null) {
    remainingAmount = vnd(Math.max(0, s.remainingAmount));
  } else if (totalPrice != null) {
    remainingAmount = vnd(Math.max(0, totalPrice - (paidAmount ?? 0)));
  }
  return {
    id: s.id,
    propertyId: s.propertyId,
    propertyName: s.propertyName ?? '',
    saleId: s.saleId ?? null,
    customerId: s.customerId ?? null,
    guestName: s.customerName,
    guestPhone: s.customerPhone,
    guestCount: s.guestCount,
    adults: s.adults ?? null,
    children: s.children ?? null,
    checkInAt: s.checkinDate,
    checkOutAt: s.checkoutDate,
    nights: s.nights ?? nightsBetween(s.checkinDate, s.checkoutDate),
    status: isPaid && status === 'confirmed' ? 'paid' : status,
    totalPrice,
    deposit: s.depositAmount == null ? null : vnd(s.depositAmount),
    paidAmount,
    remainingAmount,
    priceBreakdown: mapBreakdown(s.priceBreakdown),
    depositProofUrl: s.depositProofUrl ?? null,
    checkedInAt: s.checkedInAt ?? null,
    holdExpireAt: s.holdExpireAt ?? null,
    holdRemainingSeconds: s.holdRemainingSeconds,
    notes: s.notes,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

/** Map FE CreateBookingHoldInput → spec §5.2 body. */
function holdBody(input: CreateBookingHoldInput) {
  return {
    propertyId: input.propertyId,
    customerName: input.guestName,
    customerPhone: input.guestPhone,
    checkinDate: input.checkInAt.slice(0, 10),
    checkoutDate: input.checkOutAt.slice(0, 10),
    guestCount: input.guestCount,
    depositAmount: input.depositAmount,
    notes: input.notes,
  };
}

export class ApiBookingRepository implements BookingRepository {
  async list(filters?: BookingFilters): Promise<Booking[]> {
    const data = await apiClient.get<SpecBooking[] | { items: SpecBooking[] }>(
      '/bookings',
      {
        query: {
          status: filters?.status,
          propertyId: filters?.propertyId,
          from: filters?.from,
          to: filters?.to,
        },
        cache: 'no-store',
      },
    );
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapBooking);
  }

  async getById(id: string): Promise<Booking | null> {
    try {
      const data = await apiClient.get<SpecBooking>(`/bookings/${id}`, {
        cache: 'no-store',
      });
      return mapBooking(data);
    } catch (err) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async hold(input: CreateBookingHoldInput): Promise<Booking> {
    const data = await apiClient.post<SpecBooking>(
      '/bookings/hold',
      holdBody(input),
    );
    return mapBooking(data);
  }

  async confirm(id: string): Promise<Booking> {
    const data = await apiClient.patch<SpecBooking>(`/bookings/${id}/confirm`);
    return mapBooking(data);
  }

  async markPaid(id: string, amount?: number): Promise<Booking> {
    const data = await apiClient.patch<SpecBooking>(
      `/bookings/${id}/paid`,
      amount !== undefined ? { amount } : undefined,
    );
    return mapBooking(data);
  }

  async checkin(id: string, amount?: number): Promise<Booking> {
    const data = await apiClient.patch<SpecBooking>(
      `/bookings/${id}/checkin`,
      amount !== undefined ? { amount } : undefined,
    );
    return mapBooking(data);
  }

  async cancel(input: CancelBookingInput): Promise<Booking> {
    const data = await apiClient.patch<SpecBooking>(
      `/bookings/${input.id}/cancel`,
      { reason: input.reason },
    );
    return mapBooking(data);
  }

  async listMine(filters?: BookingFilters): Promise<Booking[]> {
    const data = await apiClient.get<SpecBooking[] | { items: SpecBooking[] }>(
      '/bookings/my-bookings',
      {
        query: {
          status: filters?.status,
          page: 1,
          limit: 50,
        },
        cache: 'no-store',
      },
    );
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapBooking);
  }

  async monthCalendar(
    filters: PropertyMonthCalendarFilters,
  ): Promise<Booking[]> {
    const data = await apiClient.get<SpecBooking[]>(
      `/bookings/calendar/${filters.propertyId}`,
      {
        query: { year: filters.year, month: filters.month },
        cache: 'no-store',
      },
    );
    return data.map(mapBooking);
  }

  async customerHold(input: CreateBookingHoldInput): Promise<Booking> {
    const data = await apiClient.post<SpecBooking>(
      '/bookings/customer-hold',
      holdBody(input),
    );
    return mapBooking(data);
  }

  async customerCancel(id: string): Promise<Booking> {
    const data = await apiClient.patch<SpecBooking>(
      `/bookings/${id}/customer-cancel`,
    );
    return mapBooking(data);
  }

  async update(input: UpdateBookingInput): Promise<Booking> {
    const data = await apiClient.put<SpecBooking>(`/bookings/${input.id}`, {
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      guestCount: input.guestCount,
      notes: input.notes,
      depositAmount: input.depositAmount,
    });
    return mapBooking(data);
  }
}
