import { z } from 'zod';

import { ValidationError, PaymentPendingError } from '@/core/errors';
import {
  roomsFromPlanId,
  type PaymentInitiateResult,
} from '@/core/entities/payment-session';
import type { PaymentPurchaseRepository } from '../ports/payment-purchase-repository';

/** Use case: OWNER bắt đầu thanh toán 1 gói — spec §10.2. Chỉ OWNER (guard ở action). */

const InputSchema = z.object({
  planId: z.string().min(1),
  cycle: z.enum(['monthly', 'yearly']),
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
  const { planId, cycle } = parsed.data;
  // KHÔNG tin `rooms` từ client — suy canonical từ planId (chống thao túng giá).
  const rooms = roomsFromPlanId(planId);

  try {
    // Quote trước để lấy totalAmount đúng (đã VAT / prorate) → tránh amountMismatch.
    const quote = await repo.quote({ planId, cycle, rooms });
    // Chặn tạo session 0đ khi quote trả thiếu/không hợp lệ (nhánh upgrade BE
    // KHÔNG validate amount → 0đ sẽ lọt nếu không guard).
    if (!Number.isFinite(quote.totalAmount) || quote.totalAmount <= 0) {
      throw new ValidationError(
        'Không xác định được số tiền cần thanh toán cho gói này. Vui lòng thử lại hoặc liên hệ hỗ trợ.',
      );
    }
    const session = await repo.initiate({
      planId,
      cycle,
      rooms,
      totalAmount: quote.totalAmount,
    });
    return { session, alreadyPending: false };
  } catch (err) {
    // CHỈ khi đã có phiên pending → hiện lại phiên đó để user hoàn tất. Mọi lỗi
    // khác (frozen/downgrade/planNotFound/amount/network) nổi lên nguyên trạng.
    if (err instanceof PaymentPendingError) {
      const active = await repo.getActive().catch(() => null);
      if (active) return { session: active, alreadyPending: true };
    }
    throw err;
  }
}
