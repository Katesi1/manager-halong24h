import 'server-only';

import type {
  CreateYachtBookingInput,
  YachtBooking,
  YachtBookingFilters,
  YachtBookingPayment,
  YachtBookingStatus,
} from '@/core/entities/yacht-booking';
import { vnd, type VND } from '@/core/value-objects/vnd';
import type {
  ConfirmYachtBookingResult,
  YachtBookingRepository,
} from '@/application/ports/yacht-booking-repository';

import { apiClient } from '../http/api-client';

/**
 * BE shape đơn du thuyền — chốt runtime 2026-07-13 (capture từ prod).
 * Tên field cố định camelCase, status là số nguyên 0..4.
 */
interface RawYachtBooking {
  id: string;
  code: string;
  yachtId: string;
  yachtName: string | null;
  saleId?: string | null;
  customerId: string | null;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  adults: number | null;
  children: number | null;
  guestCount: number;
  checkinDate: string;
  checkoutDate: string | null;
  status: number;
  totalAmount: number | null;
  paidAmount: number | null;
  remainingAmount: number | null;
  paidAt: string | null;
  confirmedAt: string | null;
  cancelledReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt?: string | null;
  hasReview?: boolean;
  reviewUnlockAt?: string | null;
  canReview?: boolean;
  payment?: unknown;
}

/** BE status number → local union (0=PENDING 1=CONFIRMED 2=PAID 3=COMPLETED 4=CANCELLED). */
const STATUS_MAP: Record<number, YachtBookingStatus> = {
  0: 'pending',
  1: 'confirmed',
  2: 'paid',
  3: 'completed',
  4: 'cancelled',
};

function mapBooking(b: RawYachtBooking): YachtBooking {
  const totalAmount = b.totalAmount == null ? null : vnd(b.totalAmount);
  const paidAmount = b.paidAmount == null ? null : vnd(b.paidAmount);
  let remainingAmount: VND | null = null;
  if (b.remainingAmount != null) {
    remainingAmount = vnd(Math.max(0, b.remainingAmount));
  } else if (totalAmount != null) {
    remainingAmount = vnd(Math.max(0, totalAmount - (paidAmount ?? 0)));
  }
  return {
    id: b.id,
    code: b.code ?? null,
    yachtId: b.yachtId,
    yachtName: b.yachtName ?? '',
    customerId: b.customerId ?? null,
    customerName: b.customerName ?? '',
    customerPhone: b.customerPhone ?? null,
    customerEmail: b.customerEmail ?? null,
    checkInAt: b.checkinDate,
    checkOutAt: b.checkoutDate ?? null,
    nights: null,
    adults: b.adults ?? null,
    children: b.children ?? null,
    guestCount: b.guestCount ?? 1,
    status: STATUS_MAP[b.status] ?? 'pending',
    totalAmount,
    paidAmount,
    remainingAmount,
    paidAt: b.paidAt ?? null,
    confirmedAt: b.confirmedAt ?? null,
    cancelledReason: b.cancelledReason ?? null,
    hasReview: b.hasReview ?? false,
    reviewUnlockAt: b.reviewUnlockAt ?? null,
    canReview: b.canReview ?? false,
    payment: b.payment != null ? mapPayment(b.payment) : null,
    notes: b.notes ?? null,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt ?? null,
  };
}

function mapPayment(raw: unknown): YachtBookingPayment {
  const p = (raw ?? {}) as Partial<YachtBookingPayment>;
  return {
    bankBin: p.bankBin ?? null,
    bankName: p.bankName ?? null,
    accountNumber: p.accountNumber ?? null,
    accountName: p.accountName ?? null,
    amount: typeof p.amount === 'number' ? p.amount : 0,
    content: p.content ?? '',
    qrCode: p.qrCode ?? null,
  };
}

export class ApiYachtBookingRepository implements YachtBookingRepository {
  async list(filters?: YachtBookingFilters): Promise<YachtBooking[]> {
    const data = await apiClient.get<
      RawYachtBooking[] | { items: RawYachtBooking[] }
    >('/yacht-bookings', {
      query: {
        status: filters?.status,
        page: filters?.page,
        limit: filters?.limit,
      },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapBooking);
  }

  async getById(id: string): Promise<YachtBooking | null> {
    try {
      const data = await apiClient.get<RawYachtBooking>(
        `/yacht-bookings/${id}`,
        { cache: 'no-store' },
      );
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

  async create(input: CreateYachtBookingInput): Promise<YachtBooking> {
    const data = await apiClient.post<RawYachtBooking>('/yacht-bookings', {
      yachtId: input.yachtId,
      customerId: input.customerId,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      customerEmail: input.customerEmail,
      checkinDate: input.checkInAt.slice(0, 10),
      checkoutDate: input.checkOutAt?.slice(0, 10),
      adults: input.adults,
      children: input.children,
      notes: input.notes,
    });
    return mapBooking(data);
  }

  async confirm(id: string): Promise<ConfirmYachtBookingResult> {
    // BE trả nguyên object booking (status=1) + key `payment` (VietQR + STK).
    const data = await apiClient.patch<RawYachtBooking & { payment?: unknown }>(
      `/yacht-bookings/${id}/confirm`,
    );
    return {
      booking: data.id ? mapBooking(data) : null,
      payment: mapPayment(data.payment),
    };
  }

  async markPaid(id: string, amount?: number): Promise<YachtBooking> {
    // BE trả booking (status=2) + `bookingCode`. Sau đó tự gửi email mã code.
    const data = await apiClient.patch<RawYachtBooking>(
      `/yacht-bookings/${id}/paid`,
      amount !== undefined ? { amount } : undefined,
    );
    return mapBooking(data);
  }

  async cancel(id: string, reason?: string): Promise<YachtBooking> {
    const data = await apiClient.patch<RawYachtBooking>(
      `/yacht-bookings/${id}/cancel`,
      reason ? { reason } : undefined,
    );
    return mapBooking(data);
  }
}
