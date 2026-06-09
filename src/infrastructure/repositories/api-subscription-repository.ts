import 'server-only';

import type {
  FreezeInput,
  MarkPaidInput,
  Subscription,
  SubscriptionCycle,
  SubscriptionFilters,
  SubscriptionPlan,
  SubscriptionStatus,
} from '@/core/entities/subscription';
import type { SubscriptionRepository } from '@/application/ports/subscription-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec §10 — BE response shape (best effort, fields BE expose).
 *
 * Spec v1.3 §22 A5 confirm Option A — 1 user = 1 active subscription, identify
 * qua userId. Port hiện vẫn dùng tên `subscriptionId` (legacy) — repo này treat
 * giá trị đó NHƯ LÀ ownerId. UI gọi action PHẢI truyền userId/ownerId.
 */
interface SpecSubscription {
  id: string;
  ownerId: string;
  ownerName?: string;
  planId?: string;
  plan?: SubscriptionPlan;
  cycle?: SubscriptionCycle;
  roomCount?: number;
  rooms?: number;
  amount?: number;
  totalAmount?: number;
  status: SubscriptionStatus;
  startsAt?: string;
  startAt?: string;
  endsAt?: string;
  nextChargeAt?: string;
  expireAt?: string;
  trialEndsAt?: string | null;
  priceOverride?: number | null;
  provider?: Subscription['provider'];
  frozenAt?: string | null;
  frozenReason?: string | null;
  paidAt?: string | null;
  invoicedAt?: string;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapPlan(s: SpecSubscription): SubscriptionPlan {
  if (s.plan) return s.plan;
  const id = s.planId ?? '';
  if (id.startsWith('rooms_1')) return 'free';
  if (id.startsWith('rooms_5')) return 'basic';
  if (id.startsWith('rooms_10')) return 'standard';
  return 'pro';
}

function mapSubscription(s: SpecSubscription): Subscription {
  // Spec v1.3 §22 A4 confirm — BE trả user-level fields, không có startsAt/endsAt.
  // Dùng nextChargeAt làm expire; fallback updatedAt chỉ cho UI display khỏi crash.
  const expire = s.nextChargeAt ?? s.updatedAt;
  return {
    id: s.id,
    ownerId: s.ownerId,
    ownerName: s.ownerName ?? '',
    plan: mapPlan(s),
    cycle: s.cycle ?? 'monthly',
    roomCount: s.roomCount ?? s.rooms ?? 0,
    amount: s.amount ?? s.totalAmount ?? 0,
    status: s.status,
    startAt: s.createdAt,
    expireAt: expire,
    nextChargeAt: s.nextChargeAt ?? null,
    trialEndsAt: s.trialEndsAt ?? null,
    priceOverride: s.priceOverride ?? null,
    provider: s.provider ?? null,
    frozenAt: s.frozenAt ?? null,
    frozenReason: s.frozenReason ?? null,
    paidAt: s.paidAt ?? null,
    invoicedAt: s.createdAt,
    note: s.frozenReason ?? null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

export class ApiSubscriptionRepository implements SubscriptionRepository {
  async list(filters?: SubscriptionFilters): Promise<Subscription[]> {
    const data = await apiClient.get<
      SpecSubscription[] | { items: SpecSubscription[] }
    >('/admin/subscriptions', {
      query: {
        status: filters?.status,
        plan: filters?.plan,
        search: filters?.search,
      },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapSubscription);
  }

  async getById(id: string): Promise<Subscription | null> {
    // Spec không expose subscription-by-id; treat id = userId.
    try {
      const data = await apiClient.get<SpecSubscription>(
        `/admin/users/${id}/subscription`,
        { cache: 'no-store' },
      );
      return mapSubscription(data);
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

  async getCurrentForOwner(_ownerId: string): Promise<Subscription | null> {
    try {
      const data = await apiClient.get<SpecSubscription>('/subscriptions/me', {
        cache: 'no-store',
      });
      return mapSubscription(data);
    } catch (err) {
      // Chỉ catch 404 = "user chưa có sub". 400 (validation), 5xx phải bubble lên
      // để caller phân biệt được thay vì block UI bằng guard không chính xác.
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

  async countOverdue(): Promise<number> {
    const data = await apiClient.get<number | { count: number }>(
      '/admin/subscriptions/count-overdue',
      { cache: 'no-store' },
    );
    return typeof data === 'number' ? data : data.count;
  }

  async sumPaidBetween(from: string, to: string): Promise<number> {
    const data = await apiClient.get<number | { total: number }>(
      '/admin/subscriptions/sum-paid',
      { query: { from, to }, cache: 'no-store' },
    );
    return typeof data === 'number' ? data : data.total;
  }

  async markPaid(input: MarkPaidInput): Promise<Subscription> {
    // Spec §10.4 — identify theo userId. Giả định subscriptionId === userId.
    const data = await apiClient.post<SpecSubscription>(
      `/admin/users/${input.subscriptionId}/subscription/mark-paid`,
      { amount: input.paidAmount },
    );
    return mapSubscription(data);
  }

  async freeze(input: FreezeInput): Promise<Subscription> {
    const data = await apiClient.post<SpecSubscription>(
      `/admin/users/${input.subscriptionId}/subscription/freeze`,
      { reason: input.reason },
    );
    return mapSubscription(data);
  }

  async unfreeze(subscriptionId: string): Promise<Subscription> {
    const data = await apiClient.post<SpecSubscription>(
      `/admin/users/${subscriptionId}/subscription/unfreeze`,
    );
    return mapSubscription(data);
  }
}
