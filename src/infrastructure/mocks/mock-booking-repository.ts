import 'server-only';

import { NotFoundError } from '@/core/errors';
import type {
  Booking,
  BookingFilters,
  CancelBookingInput,
  CreateBookingHoldInput,
} from '@/core/entities/booking';
import type { BookingRepository } from '@/application/ports/booking-repository';
import { vnd } from '@/core/value-objects/vnd';

const SEED: Booking[] = [
  {
    id: 'mock-bk-001',
    propertyId: 'mock-prop-001',
    propertyName: 'Villa B1716',
    guestName: 'Nguyễn Văn An',
    guestPhone: '0912345678',
    guestCount: 4,
    checkInAt: '2026-05-10T14:00:00.000Z',
    checkOutAt: '2026-05-12T12:00:00.000Z',
    nights: 2,
    status: 'confirmed',
    totalPrice: vnd(3_000_000),
    deposit: vnd(1_500_000),
    notes: 'Khách yêu cầu BBQ buổi tối đầu tiên.',
    createdAt: '2026-05-01T08:30:00.000Z',
  },
  {
    id: 'mock-bk-002',
    propertyId: 'mock-prop-001',
    propertyName: 'Villa B1716',
    guestName: 'Trần Thị Bình',
    guestPhone: '0987654321',
    guestCount: 6,
    checkInAt: '2026-05-15T14:00:00.000Z',
    checkOutAt: '2026-05-17T12:00:00.000Z',
    nights: 2,
    status: 'hold',
    totalPrice: vnd(4_000_000),
    deposit: vnd(0),
    holdExpireAt: new Date(Date.now() + 25 * 60_000).toISOString(),
    holdRemainingSeconds: 25 * 60,
    notes: null,
    createdAt: '2026-05-05T10:15:00.000Z',
  },
  {
    id: 'mock-bk-003',
    propertyId: 'mock-prop-002',
    propertyName: 'Homestay Bãi Cháy',
    guestName: 'Lê Hữu Châu',
    guestPhone: '0901234567',
    guestCount: 2,
    checkInAt: '2026-04-28T14:00:00.000Z',
    checkOutAt: '2026-04-30T12:00:00.000Z',
    nights: 2,
    status: 'completed',
    totalPrice: vnd(1_800_000),
    deposit: vnd(900_000),
    notes: null,
    createdAt: '2026-04-20T16:00:00.000Z',
  },
];

const store = new Map<string, Booking>(SEED.map((b) => [b.id, b]));

function nightsBetween(a: string, b: string): number {
  return Math.max(
    1,
    Math.round(
      (new Date(b).getTime() - new Date(a).getTime()) / (24 * 60 * 60 * 1000),
    ),
  );
}

export class MockBookingRepository implements BookingRepository {
  async list(filters?: BookingFilters): Promise<Booking[]> {
    let out = Array.from(store.values());
    if (filters?.status) out = out.filter((b) => b.status === filters.status);
    if (filters?.propertyId) {
      out = out.filter((b) => b.propertyId === filters.propertyId);
    }
    if (filters?.from) {
      out = out.filter((b) => b.checkOutAt >= filters.from!);
    }
    if (filters?.to) {
      out = out.filter((b) => b.checkInAt <= filters.to!);
    }
    return out.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getById(id: string): Promise<Booking | null> {
    return store.get(id) ?? null;
  }

  async hold(input: CreateBookingHoldInput): Promise<Booking> {
    const id = `mock-bk-${Date.now()}`;
    const now = new Date();
    const holdExpireAt = new Date(now.getTime() + 30 * 60_000);
    const nights = nightsBetween(input.checkInAt, input.checkOutAt);
    const booking: Booking = {
      id,
      propertyId: input.propertyId,
      propertyName: 'Cơ sở demo',
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestCount: input.guestCount,
      checkInAt: input.checkInAt,
      checkOutAt: input.checkOutAt,
      nights,
      status: 'hold',
      totalPrice: vnd((input.depositAmount ?? 0) * 2 || nights * 1_500_000),
      deposit: vnd(input.depositAmount ?? 0),
      holdExpireAt: holdExpireAt.toISOString(),
      holdRemainingSeconds: 30 * 60,
      notes: input.notes ?? null,
      createdAt: now.toISOString(),
    };
    store.set(id, booking);
    return booking;
  }

  async confirm(id: string): Promise<Booking> {
    const b = store.get(id);
    if (!b) throw new NotFoundError('Không tìm thấy booking');
    const updated: Booking = {
      ...b,
      status: 'confirmed',
      holdExpireAt: null,
      holdRemainingSeconds: undefined,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  }

  async markPaid(id: string, amount?: number): Promise<Booking> {
    const b = store.get(id);
    if (!b) throw new NotFoundError('Không tìm thấy booking');
    const receivedThisTime = amount ?? b.totalPrice - b.deposit;
    const newDeposit = vnd(Math.min(b.totalPrice, b.deposit + receivedThisTime));
    const fullyPaid = newDeposit >= b.totalPrice;
    const updated: Booking = {
      ...b,
      // Partial: vẫn confirmed, chỉ cộng dồn deposit.
      // Full: chuyển sang paid → auto gửi Email 2 ở BE.
      status: fullyPaid ? 'paid' : 'confirmed',
      deposit: newDeposit,
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  }

  async cancel(input: CancelBookingInput): Promise<Booking> {
    const b = store.get(input.id);
    if (!b) throw new NotFoundError('Không tìm thấy booking');
    const updated: Booking = {
      ...b,
      status: 'cancelled',
      holdExpireAt: null,
      holdRemainingSeconds: undefined,
      notes: input.reason ? `[Huỷ] ${input.reason}` : b.notes,
      updatedAt: new Date().toISOString(),
    };
    store.set(input.id, updated);
    return updated;
  }

  async listMine(filters?: BookingFilters): Promise<Booking[]> {
    return this.list(filters);
  }

  async monthCalendar(filters: {
    propertyId: string;
    year: number;
    month: number;
  }): Promise<Booking[]> {
    return Array.from(store.values()).filter(
      (b) => b.propertyId === filters.propertyId,
    );
  }

  async customerHold(input: CreateBookingHoldInput): Promise<Booking> {
    return this.hold(input);
  }

  async customerCancel(id: string): Promise<Booking> {
    return this.cancel({ id });
  }

  async update(input: {
    id: string;
    customerName?: string;
    customerPhone?: string;
    guestCount?: number;
    notes?: string;
    depositAmount?: number;
  }): Promise<Booking> {
    const b = store.get(input.id);
    if (!b) throw new NotFoundError('Không tìm thấy booking');
    const updated: Booking = {
      ...b,
      guestName: input.customerName ?? b.guestName,
      guestPhone: input.customerPhone ?? b.guestPhone,
      guestCount: input.guestCount ?? b.guestCount,
      notes: input.notes ?? b.notes,
      deposit:
        input.depositAmount !== undefined ? vnd(input.depositAmount) : b.deposit,
      updatedAt: new Date().toISOString(),
    };
    store.set(input.id, updated);
    return updated;
  }
}
