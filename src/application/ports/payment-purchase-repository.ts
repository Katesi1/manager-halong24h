import type { PaymentInitiateResult } from '@/core/entities/payment-session';

/** Luồng OWNER mua/gia hạn gói cước — spec §10.2 (`/payments/*`). */

export interface QuoteInput {
  planId: string;
  cycle: 'monthly' | 'yearly';
  rooms?: number;
}

export interface InitiateInput {
  planId: string;
  cycle: 'monthly' | 'yearly';
  rooms: number;
  /** Lấy từ quote để tránh 400 amountMismatch. */
  totalAmount: number;
}

export interface PaymentQuote {
  totalAmount: number;
  kind: string | null;
}

export interface PaymentPurchaseRepository {
  /** POST /payments/quote — read-only, trả totalAmount (đã VAT/prorate). */
  quote(input: QuoteInput): Promise<PaymentQuote>;
  /** POST /payments/initiate — tạo session, trả bankInfo THẬT + QR + ckContent. */
  initiate(input: InitiateInput): Promise<PaymentInitiateResult>;
  /** GET /payments/active — session pending mới nhất (null nếu không có). */
  getActive(): Promise<PaymentInitiateResult | null>;
}
