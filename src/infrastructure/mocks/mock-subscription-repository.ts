import { NotFoundError } from '@/core/errors';
import {
  PRICE_PER_ROOM,
  type FreezeInput,
  type MarkPaidInput,
  type Subscription,
  type SubscriptionFilters,
} from '@/core/entities/subscription';
import type { SubscriptionRepository } from '@/application/ports/subscription-repository';

const NOW = '2026-05-17T00:00:00.000Z';

function plus(date: string, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

const SEED: Subscription[] = [
  {
    id: 'sub-2026-05-001',
    ownerId: 'owner-001',
    ownerName: 'Trần Đức Tuấn',
    planId: 'rooms_5',
    plan: 'basic',
    cycle: 'monthly',
    roomCount: 5,
    amount: 5 * PRICE_PER_ROOM.basic,
    status: 'active',
    startAt: '2026-05-05T00:00:00.000Z',
    expireAt: '2026-06-05T00:00:00.000Z',
    paidAt: '2026-05-05T09:00:00.000Z',
    invoicedAt: '2026-05-01T00:00:00.000Z',
    note: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-05T09:00:00.000Z',
  },
  {
    id: 'sub-2026-05-002',
    ownerId: 'owner-004',
    ownerName: 'Lê Hoàng Đức',
    planId: 'rooms_20',
    plan: 'standard',
    cycle: 'monthly',
    roomCount: 18,
    amount: 18 * PRICE_PER_ROOM.standard,
    status: 'active',
    startAt: '2026-05-08T00:00:00.000Z',
    expireAt: '2026-06-08T00:00:00.000Z',
    paidAt: '2026-05-08T11:00:00.000Z',
    invoicedAt: '2026-05-01T00:00:00.000Z',
    note: null,
    createdAt: '2026-05-01T00:00:00.000Z',
    updatedAt: '2026-05-08T11:00:00.000Z',
  },
  {
    id: 'sub-2026-05-003',
    ownerId: 'owner-002',
    ownerName: 'Phạm Văn An',
    planId: 'rooms_10',
    plan: 'basic',
    cycle: 'monthly',
    roomCount: 6,
    amount: 6 * PRICE_PER_ROOM.basic,
    status: 'none',
    startAt: '2026-05-10T00:00:00.000Z',
    expireAt: '2026-06-10T00:00:00.000Z',
    paidAt: null,
    invoicedAt: '2026-05-10T00:00:00.000Z',
    note: null,
    createdAt: '2026-05-10T00:00:00.000Z',
    updatedAt: '2026-05-10T00:00:00.000Z',
  },
  {
    id: 'sub-2026-04-001',
    ownerId: 'owner-005',
    ownerName: 'Vũ Minh Châu',
    planId: 'rooms_50',
    plan: 'pro',
    cycle: 'monthly',
    roomCount: 42,
    amount: 42 * PRICE_PER_ROOM.pro,
    status: 'past_due',
    startAt: '2026-04-05T00:00:00.000Z',
    expireAt: '2026-05-05T00:00:00.000Z',
    paidAt: null,
    invoicedAt: '2026-04-01T00:00:00.000Z',
    note: 'Đã gọi 3 lần, chủ nhà hứa chuyển TT trong tuần này.',
    createdAt: '2026-04-01T00:00:00.000Z',
    updatedAt: '2026-05-06T00:00:00.000Z',
  },
  {
    id: 'sub-2026-03-007',
    ownerId: 'owner-006',
    ownerName: 'Bùi Thị Hồng',
    planId: 'rooms_5',
    plan: 'basic',
    cycle: 'monthly',
    roomCount: 4,
    amount: 4 * PRICE_PER_ROOM.basic,
    status: 'frozen',
    startAt: '2026-03-15T00:00:00.000Z',
    expireAt: '2026-04-15T00:00:00.000Z',
    paidAt: null,
    invoicedAt: '2026-03-10T00:00:00.000Z',
    note: 'Tạm khoá do 5 dispute liên tiếp + nợ phí 2 tháng.',
    createdAt: '2026-03-10T00:00:00.000Z',
    updatedAt: '2026-05-01T00:00:00.000Z',
  },
];

const store = new Map<string, Subscription>(SEED.map((s) => [s.id, s]));

function matchesFilters(s: Subscription, f: SubscriptionFilters): boolean {
  if (f.status && s.status !== f.status) return false;
  if (f.plan && s.plan !== f.plan) return false;
  if (f.ownerId && s.ownerId !== f.ownerId) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    if (!`${s.ownerName} ${s.ownerId}`.toLowerCase().includes(q)) return false;
  }
  return true;
}

export class MockSubscriptionRepository implements SubscriptionRepository {
  async list(filters: SubscriptionFilters = {}): Promise<Subscription[]> {
    return Array.from(store.values())
      .filter((s) => matchesFilters(s, filters))
      .sort((a, b) => b.startAt.localeCompare(a.startAt));
  }

  async getById(id: string): Promise<Subscription | null> {
    return store.get(id) ?? null;
  }

  async getCurrentForOwner(ownerId: string): Promise<Subscription | null> {
    const list = Array.from(store.values())
      .filter((s) => s.ownerId === ownerId)
      .sort((a, b) => b.startAt.localeCompare(a.startAt));
    return list[0] ?? null;
  }

  async countOverdue(): Promise<number> {
    return Array.from(store.values()).filter((s) => s.status === 'past_due')
      .length;
  }

  async sumPaidBetween(from: string, to: string): Promise<number> {
    return Array.from(store.values())
      .filter(
        (s) => s.paidAt && s.paidAt >= from && s.paidAt <= to && s.status === 'active',
      )
      .reduce((total, s) => total + s.amount, 0);
  }

  async markPaid(input: MarkPaidInput): Promise<Subscription> {
    const sub = store.get(input.subscriptionId);
    if (!sub) throw new NotFoundError('Không tìm thấy subscription');
    const updated: Subscription = {
      ...sub,
      status: 'active',
      paidAt: new Date().toISOString(),
      // Gia hạn từ ngày trả: monthly = +30, yearly = +365
      expireAt: plus(NOW, sub.cycle === 'yearly' ? 365 : 30),
      updatedAt: new Date().toISOString(),
    };
    store.set(updated.id, updated);
    return updated;
  }

  async freeze(input: FreezeInput): Promise<Subscription> {
    const sub = store.get(input.subscriptionId);
    if (!sub) throw new NotFoundError('Không tìm thấy subscription');
    const updated: Subscription = {
      ...sub,
      status: 'frozen',
      note: input.reason,
      updatedAt: new Date().toISOString(),
    };
    store.set(updated.id, updated);
    return updated;
  }

  async unfreeze(subscriptionId: string): Promise<Subscription> {
    const sub = store.get(subscriptionId);
    if (!sub) throw new NotFoundError('Không tìm thấy subscription');
    // Sau khi unfreeze, chuyển về overdue nếu expireAt < now, ngược lại paid
    const isExpired = sub.expireAt < new Date().toISOString();
    const updated: Subscription = {
      ...sub,
      status: isExpired ? 'past_due' : 'active',
      note: null,
      updatedAt: new Date().toISOString(),
    };
    store.set(updated.id, updated);
    return updated;
  }
}
