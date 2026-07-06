import 'server-only';

import type {
  PaymentBankInfo,
  PaymentInitiateResult,
  PaymentSessionStatus,
} from '@/core/entities/payment-session';
import { paymentSessionPlanLabel } from '@/core/entities/payment-session';
import { PaymentPendingError } from '@/core/errors';
import type {
  InitiateInput,
  PaymentPurchaseRepository,
  PaymentQuote,
  QuoteInput,
} from '@/application/ports/payment-purchase-repository';

import { apiClient } from '../http/api-client';
import { ApiError } from '../http/api-error';

interface SpecBankInfo {
  bankName?: string | null;
  accountNumber?: string | null;
  accountName?: string | null;
  bankBin?: string | null;
  content?: string | null;
  vietQrPayload?: string | null;
}

interface SpecSession {
  sessionId?: string;
  id?: string;
  status?: string;
  totalAmount?: number;
  planId?: string;
  planLabel?: string;
  cycle?: string;
  rooms?: number;
  bankInfo?: SpecBankInfo | null;
  ckContent?: string | null;
  qrExpiresAt?: string | null;
  expiresAt?: string | null;
  kind?: string | null;
}

function mapSession(s: SpecSession): PaymentInitiateResult {
  const sessionId = s.sessionId ?? s.id ?? '';
  const rooms = typeof s.rooms === 'number' ? s.rooms : 0;
  const bank = s.bankInfo ?? {};
  // Nội dung CK: ưu tiên bankInfo.content → ckContent → suy từ sessionId.
  const content =
    bank.content ??
    s.ckContent ??
    (sessionId ? `HALONG24H ${sessionId}` : '');
  const bankInfo: PaymentBankInfo = {
    bankName: bank.bankName ?? null,
    accountNumber: bank.accountNumber ?? null,
    accountName: bank.accountName ?? null,
    bankBin: bank.bankBin ?? null,
    content,
    vietQrPayload: bank.vietQrPayload ?? null,
  };
  return {
    sessionId,
    status: (s.status as PaymentSessionStatus) ?? 'pending',
    totalAmount: typeof s.totalAmount === 'number' ? s.totalAmount : 0,
    planId: s.planId ?? '',
    planLabel: s.planLabel ?? paymentSessionPlanLabel(s.planId ?? '', rooms),
    cycle: s.cycle === 'yearly' ? 'yearly' : 'monthly',
    rooms,
    bankInfo,
    ckContent: s.ckContent ?? content,
    qrExpiresAt: s.qrExpiresAt ?? null,
    expiresAt: s.expiresAt ?? null,
    kind: s.kind ?? null,
  };
}

export class ApiPaymentPurchaseRepository implements PaymentPurchaseRepository {
  async quote(input: QuoteInput): Promise<PaymentQuote> {
    const data = await apiClient.post<{
      totalAmount?: number;
      kind?: string | null;
    }>('/payments/quote', {
      planId: input.planId,
      cycle: input.cycle,
      rooms: input.rooms,
    });
    return {
      totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : 0,
      kind: data.kind ?? null,
    };
  }

  async initiate(input: InitiateInput): Promise<PaymentInitiateResult> {
    try {
      const data = await apiClient.post<SpecSession>('/payments/initiate', {
        planId: input.planId,
        cycle: input.cycle,
        method: 'bank_transfer',
        rooms: input.rooms,
        totalAmount: input.totalAmount,
      });
      return mapSession(data);
    } catch (err) {
      // Chỉ 409 `paymentPending` mới nên hiện lại phiên đang chờ; các lỗi khác
      // (amountMismatch/planNotFound/subscriptionFrozen/downgradeScheduled) phải
      // nổi lên nguyên trạng (spec §10.2.5).
      if (
        err instanceof ApiError &&
        err.status === 409 &&
        err.payload?.code === 'paymentPending'
      ) {
        throw new PaymentPendingError(err.message);
      }
      throw err;
    }
  }

  async getActive(): Promise<PaymentInitiateResult | null> {
    const data = await apiClient.get<SpecSession | null>('/payments/active', {
      cache: 'no-store',
    });
    return data ? mapSession(data) : null;
  }
}
