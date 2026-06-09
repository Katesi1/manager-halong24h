import 'server-only';

import type {
  MarkSessionPaidInput,
  PaymentSession,
  PaymentSessionFilters,
  PaymentSessionStatus,
} from '@/core/entities/payment-session';
import type { PaymentSessionRepository } from '@/application/ports/payment-session-repository';

import { apiClient } from '../http/api-client';

/**
 * BE shape có thể trả 1 trong các kiểu sau cho user info:
 *  - flat: `userName`, `userEmail` (FE-friendly, ưu tiên)
 *  - nested: `user: { id, name, email, phone }` (theo v1.11 §2.3 pattern)
 *  - mixed: thiếu name nhưng có email → FE fallback dùng phần local của email
 *
 * Mapper này nhận tất cả, normalize về PaymentSession entity. Field trống → ''.
 */
interface RawUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface RawSession {
  id: string;
  userId?: string;
  userName?: string | null;
  userEmail?: string | null;
  user?: RawUser | null;
  planId?: string;
  cycle?: 'monthly' | 'yearly';
  rooms?: number;
  totalAmount?: number;
  amount?: number;
  method?: 'bank_transfer';
  status: PaymentSessionStatus;
  ckContent?: string;
  transferContent?: string;
  expiresAt?: string;
  expiredAt?: string;
  paidAt?: string | null;
  reference?: string | null;
  bankReference?: string | null;
  createdAt: string;
  updatedAt?: string;
}

function mapSession(r: RawSession): PaymentSession {
  return {
    id: r.id,
    userId: r.userId ?? r.user?.id ?? '',
    userName: r.userName ?? r.user?.name ?? '',
    userEmail: r.userEmail ?? r.user?.email ?? '',
    planId: r.planId ?? '',
    cycle: r.cycle ?? 'monthly',
    rooms: r.rooms ?? 0,
    totalAmount: r.totalAmount ?? r.amount ?? 0,
    method: r.method ?? 'bank_transfer',
    status: r.status,
    ckContent: r.ckContent ?? r.transferContent ?? `HALONG24H ${r.id}`,
    expiresAt: r.expiresAt ?? r.expiredAt ?? r.createdAt,
    paidAt: r.paidAt ?? null,
    reference: r.reference ?? r.bankReference ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt ?? r.createdAt,
  };
}

export class ApiPaymentSessionRepository implements PaymentSessionRepository {
  async list(filters?: PaymentSessionFilters): Promise<PaymentSession[]> {
    const data = await apiClient.get<RawSession[] | { items: RawSession[] }>(
      '/admin/payments',
      {
        query: {
          status: filters?.status,
          from: filters?.from,
          to: filters?.to,
          search: filters?.search,
          page: filters?.page,
          limit: filters?.limit,
        },
        cache: 'no-store',
      },
    );
    const items = Array.isArray(data) ? data : (data.items ?? []);
    return items.map(mapSession);
  }

  async markPaid(input: MarkSessionPaidInput): Promise<PaymentSession> {
    const raw = await apiClient.post<RawSession>(
      `/admin/payments/${input.sessionId}/mark-paid`,
      input.reference ? { reference: input.reference } : undefined,
    );
    return mapSession(raw);
  }
}
