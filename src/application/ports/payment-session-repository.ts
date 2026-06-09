import type {
  MarkSessionPaidInput,
  PaymentSession,
  PaymentSessionFilters,
} from '@/core/entities/payment-session';

export interface PaymentSessionRepository {
  /** Spec v1.6 — GET /admin/payments?status&from&to&search&page&limit */
  list(filters?: PaymentSessionFilters): Promise<PaymentSession[]>;
  /** Spec v1.6 — POST /admin/payments/:sessionId/mark-paid (idempotent). */
  markPaid(input: MarkSessionPaidInput): Promise<PaymentSession>;
}
