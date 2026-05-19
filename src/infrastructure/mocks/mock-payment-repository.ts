import 'server-only';

import type { Payment, PaymentFilters } from '@/core/entities/payment';
import type { PaymentRepository } from '@/application/ports/payment-repository';
import { vnd } from '@/core/value-objects/vnd';

const SEED: Payment[] = [
  {
    id: 'mock-pay-001',
    bookingId: 'mock-bk-001',
    bookingCode: 'HL-2026-05-0001',
    guestName: 'Nguyễn Văn An',
    amount: vnd(1_500_000),
    method: 'vietqr',
    status: 'paid',
    paidAt: '2026-05-01T08:35:12.000Z',
    reference: 'VQR2026050100123',
    createdAt: '2026-05-01T08:30:00.000Z',
  },
  {
    id: 'mock-pay-002',
    bookingId: 'mock-bk-002',
    bookingCode: 'HL-2026-05-0002',
    guestName: 'Trần Thị Bình',
    amount: vnd(0),
    method: 'vietqr',
    status: 'pending',
    paidAt: null,
    reference: null,
    createdAt: '2026-05-05T10:15:00.000Z',
  },
  {
    id: 'mock-pay-003',
    bookingId: 'mock-bk-003',
    bookingCode: 'HL-2026-04-0028',
    guestName: 'Lê Hữu Châu',
    amount: vnd(900_000),
    method: 'cash',
    status: 'paid',
    paidAt: '2026-04-28T14:05:00.000Z',
    reference: null,
    createdAt: '2026-04-28T14:00:00.000Z',
  },
];

export class MockPaymentRepository implements PaymentRepository {
  async list(filters?: PaymentFilters): Promise<Payment[]> {
    let out = [...SEED];
    if (filters?.status) out = out.filter((p) => p.status === filters.status);
    if (filters?.bookingId) {
      out = out.filter((p) => p.bookingId === filters.bookingId);
    }
    if (filters?.from) out = out.filter((p) => p.createdAt >= filters.from!);
    if (filters?.to) out = out.filter((p) => p.createdAt <= filters.to!);
    return out.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getById(id: string): Promise<Payment | null> {
    return SEED.find((p) => p.id === id) ?? null;
  }
}
