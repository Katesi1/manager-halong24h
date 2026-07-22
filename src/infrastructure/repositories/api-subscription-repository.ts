import 'server-only';

import {
  calcSubscriptionAmount,
  planForRoomCount,
  type CallLogAdmin,
  type FreezeInput,
  type InvoiceKind,
  type MarkPaidInput,
  type Subscription,
  type SubscriptionCallLog,
  type SubscriptionCycle,
  type SubscriptionFilters,
  type SubscriptionInvoice,
  type SubscriptionPlan,
  type SubscriptionStatus,
} from '@/core/entities/subscription';
import type { SubscriptionRepository } from '@/application/ports/subscription-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec §10 — BE response shape.
 *
 * `GET /admin/subscriptions` trả **user-level** field (spec §22 A4 CONFIRMED),
 * KHÔNG phải Subscription row: `id` = userId, `name`/`email`/`phone`,
 * `subscriptionStatus`, `subscriptionPlanId` (`rooms_5`), `subscriptionCycle`,
 * `subscriptionPriceOverride`, `nextChargeAt`, `trialEndsAt`, frozen fields.
 *
 * BE 2026-06-13 bổ sung `rooms` (số phòng tính phí, không suy từ planId nữa →
 * `enterprise` hết sai) + `amount` (VND đã gồm VAT, cùng công thức
 * `POST /payments/quote`; `null` khi user chưa có plan). FE đọc thẳng 2 field
 * này, KHÔNG tự tính tiền nữa — chỉ fallback công thức khi BE trả thiếu.
 *
 * `/admin/users/:id/subscription`, `.../mark-paid`, `/freeze`, `/unfreeze`,
 * `/subscriptions/me` có thể trả cùng shape hoặc shape cũ (legacy key) → mapper
 * này đọc cả hai họ field với fallback để không vỡ ở bất kỳ endpoint nào.
 *
 * Spec §22 A5 confirm Option A — 1 user = 1 active subscription, identify qua
 * userId. Repo treat `Subscription.id` === userId; UI action truyền userId.
 */
interface SpecSubscription {
  id: string;
  // ── user-level shape (GET /admin/subscriptions — §A4) ───────────────────
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  isActive?: boolean;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionPlanId?: string;
  subscriptionCycle?: SubscriptionCycle;
  subscriptionProvider?: Subscription['provider'];
  subscriptionPriceOverride?: number | null;
  subscriptionFrozenAt?: string | null;
  subscriptionFrozenReason?: string | null;
  // ── legacy / snapshot shape (fallback) ──────────────────────────────────
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string | null;
  planId?: string;
  plan?: SubscriptionPlan;
  cycle?: SubscriptionCycle;
  roomCount?: number;
  rooms?: number;
  amount?: number | null;
  totalAmount?: number;
  status?: SubscriptionStatus;
  priceOverride?: number | null;
  provider?: Subscription['provider'];
  frozenAt?: string | null;
  frozenReason?: string | null;
  // ── mark-paid (nâng gói) response ────────────────────────────────────────
  userId?: string;
  startsAt?: string | null;
  endsAt?: string | null;
  // ── chung ───────────────────────────────────────────────────────────────
  nextChargeAt?: string | null;
  trialEndsAt?: string | null;
  paidAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** `rooms_5` → 5. `enterprise` / không khớp → 0. */
function roomsFromPlanId(planId: string): number {
  const m = /^rooms_(\d+)/.exec(planId);
  return m ? parseInt(m[1]!, 10) : 0;
}

/** Spec — item trong `GET /subscriptions/me/invoices` → `data.items[]`. */
interface SpecInvoice {
  id: string;
  invoiceNumber?: string | null;
  kind?: InvoiceKind;
  planId?: string | null;
  planLabel?: string | null;
  cycle?: SubscriptionCycle;
  rooms?: number | null;
  period?: string | null;
  amount?: number | null;
  method?: string | null;
  status?: string | null;
  provider?: string | null;
  referenceCode?: string | null;
  paidAt?: string | null;
  refundedAt?: string | null;
  refundedAmount?: number | null;
  expiresAt?: string | null;
  createdAt?: string | null;
}

function mapInvoice(i: SpecInvoice): SubscriptionInvoice {
  return {
    id: i.id,
    invoiceNumber: i.invoiceNumber ?? '',
    kind: i.kind ?? 'subscription',
    planId: i.planId ?? '',
    planLabel: i.planLabel ?? '',
    cycle: i.cycle ?? 'monthly',
    rooms: i.rooms ?? 0,
    period: i.period ?? '',
    amount: i.amount ?? 0,
    method: i.method ?? '',
    status: i.status ?? '',
    provider: i.provider ?? '',
    referenceCode: i.referenceCode ?? null,
    paidAt: i.paidAt ?? null,
    refundedAt: i.refundedAt ?? null,
    refundedAmount: i.refundedAmount ?? null,
    expiresAt: i.expiresAt ?? null,
    createdAt: i.createdAt ?? '',
  };
}

/** Spec — item trong `GET /admin/subscriptions/:id/call-log`. */
interface SpecCallLog {
  id: string;
  userId?: string | null;
  adminId?: string | null;
  note?: string | null;
  createdAt?: string | null;
  admin?: { id: string; name?: string | null; email?: string | null } | null;
}

function mapCallLogAdmin(
  a: SpecCallLog['admin'],
): CallLogAdmin | null {
  if (!a) return null;
  return { id: a.id, name: a.name ?? '', email: a.email ?? '' };
}

function mapCallLog(c: SpecCallLog, fallbackUserId: string): SubscriptionCallLog {
  return {
    id: c.id,
    userId: c.userId ?? fallbackUserId,
    adminId: c.adminId ?? '',
    note: c.note ?? '',
    createdAt: c.createdAt ?? '',
    admin: mapCallLogAdmin(c.admin),
  };
}

function mapSubscription(s: SpecSubscription): Subscription {
  const planId = s.subscriptionPlanId ?? s.planId ?? '';
  const roomCount = s.roomCount ?? s.rooms ?? roomsFromPlanId(planId);
  const plan = s.plan ?? planForRoomCount(roomCount);
  const cycle = s.subscriptionCycle ?? s.cycle ?? 'monthly';
  const priceOverride = s.subscriptionPriceOverride ?? s.priceOverride ?? null;
  // Số tiền/kỳ: ưu tiên BE trả thẳng; nếu không, dùng priceOverride; cuối cùng
  // suy ra từ công thức plan × số phòng (priceOverride=0 = miễn phí, phải tôn trọng).
  const amount =
    s.amount ??
    s.totalAmount ??
    (priceOverride != null
      ? priceOverride
      : calcSubscriptionAmount(plan, roomCount, cycle));
  const status = s.subscriptionStatus ?? s.status ?? 'none';
  const nextChargeAt = s.nextChargeAt ?? s.endsAt ?? null;
  const trialEndsAt = s.trialEndsAt ?? null;
  const createdAt = s.createdAt ?? s.startsAt ?? '';
  const expireAt = nextChargeAt ?? trialEndsAt ?? s.updatedAt ?? createdAt;
  const frozenReason = s.subscriptionFrozenReason ?? s.frozenReason ?? null;
  // §A4: list response không có `ownerId` riêng — `id` chính là userId.
  // mark-paid response dùng `userId` thay `id`.
  const ownerId = s.ownerId ?? s.userId ?? s.id ?? '';
  return {
    id: s.id ?? s.userId ?? '',
    ownerId,
    ownerName: s.ownerName ?? s.name ?? '',
    ownerEmail: s.ownerEmail ?? s.email ?? null,
    planId,
    plan,
    cycle,
    roomCount,
    amount,
    status,
    startAt: s.startsAt ?? createdAt,
    expireAt,
    nextChargeAt,
    trialEndsAt,
    priceOverride,
    provider: s.subscriptionProvider ?? s.provider ?? null,
    frozenAt: s.subscriptionFrozenAt ?? s.frozenAt ?? null,
    frozenReason,
    paidAt: s.paidAt ?? null,
    invoicedAt: createdAt,
    note: frozenReason,
    createdAt,
    updatedAt: s.updatedAt ?? createdAt,
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

  async listMyInvoices(): Promise<SubscriptionInvoice[]> {
    // Spec — Auth OWNER/SALE. SALE 400 `users.saleNotAssigned` nếu chưa gán owner
    // → bubble lên action (caller hiển thị notice, không crash).
    const data = await apiClient.get<{ items?: SpecInvoice[]; total?: number }>(
      '/subscriptions/me/invoices',
      { cache: 'no-store' },
    );
    return (data.items ?? []).map(mapInvoice);
  }

  async countOverdue(): Promise<number> {
    // BE 2026-06-13: `{ count }` (sau khi apiClient unwrap envelope `data`).
    const data = await apiClient.get<number | { count?: number }>(
      '/admin/subscriptions/count-overdue',
      { cache: 'no-store' },
    );
    return typeof data === 'number' ? data : (data.count ?? 0);
  }

  async sumPaidBetween(from: string, to: string): Promise<number> {
    // BE 2026-06-13: `{ totalPaid, count, from, to }` — KHÔNG phải `total`.
    const data = await apiClient.get<
      number | { totalPaid?: number; total?: number }
    >('/admin/subscriptions/sum-paid', {
      query: { from, to },
      cache: 'no-store',
    });
    if (typeof data === 'number') return data;
    return data.totalPaid ?? data.total ?? 0;
  }

  async markPaid(input: MarkPaidInput): Promise<Subscription> {
    // Spec §10.4 — identify theo userId. Giả định subscriptionId === userId.
    // Body tối thiểu chỉ { amount } (đối soát gia hạn); nâng gói thủ công gửi
    // thêm planId/cycle/rooms/days/reference/note (chỉ đính field có giá trị để
    // BE tự dùng default cho phần bỏ trống).
    const body: Record<string, unknown> = { amount: input.paidAmount };
    if (input.planId) body.planId = input.planId;
    if (input.cycle) body.cycle = input.cycle;
    if (input.rooms != null) body.rooms = input.rooms;
    if (input.days != null) body.days = input.days;
    if (input.reference) body.reference = input.reference;
    if (input.note) body.note = input.note;
    const data = await apiClient.post<SpecSubscription>(
      `/admin/users/${input.subscriptionId}/subscription/mark-paid`,
      body,
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

  async addCallLog(userId: string, note: string): Promise<SubscriptionCallLog> {
    // Spec — `:id` là OWNER userId. POST body { note } → { id, userId, adminId, note, createdAt }.
    const data = await apiClient.post<SpecCallLog>(
      `/admin/subscriptions/${userId}/call-log`,
      { note },
    );
    return mapCallLog(data, userId);
  }

  async listCallLogs(userId: string): Promise<SubscriptionCallLog[]> {
    // Spec — newest-first, mỗi item kèm admin { id, name, email }.
    const data = await apiClient.get<{ items?: SpecCallLog[] } | SpecCallLog[]>(
      `/admin/subscriptions/${userId}/call-log`,
      { cache: 'no-store' },
    );
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map((c) => mapCallLog(c, userId));
  }
}
