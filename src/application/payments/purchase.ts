import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type { PaymentInitiateResult } from '@/core/entities/payment-session';
import type { PaymentPurchaseRepository } from '../ports/payment-purchase-repository';

/** Use case: OWNER bắt đầu thanh toán 1 gói — spec §10.2. Chỉ OWNER (guard ở action). */

const InputSchema = z.object({
  planId: z.string().min(1),
  cycle: z.enum(['monthly', 'yearly']),
  rooms: z.number().int().positive(),
});

export interface StartPlanPaymentOutput {
  session: PaymentInitiateResult;
  /** true nếu user đã có phiên pending trước đó (BE trả paymentPending) → hiện lại. */
  alreadyPending: boolean;
}

export async function startPlanPaymentUseCase(
  repo: PaymentPurchaseRepository,
  raw: unknown,
): Promise<StartPlanPaymentOutput> {
  const parsed = InputSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Thông tin gói không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  const { planId, cycle, rooms } = parsed.data;

  try {
    // Quote trước để lấy totalAmount đúng (đã VAT / prorate) → tránh amountMismatch.
    const quote = await repo.quote({ planId, cycle, rooms });
    const session = await repo.initiate({
      planId,
      cycle,
      rooms,
      totalAmount: quote.totalAmount,
    });
    return { session, alreadyPending: false };
  } catch (err) {
    // Nếu user đã có phiên pending (paymentPending) → hiện lại phiên đó để hoàn tất
    // thay vì báo lỗi cụt. getActive lỗi/không có → ném lỗi gốc ra ngoài.
    const active = await repo.getActive().catch(() => null);
    if (active) return { session: active, alreadyPending: true };
    throw err;
  }
}
