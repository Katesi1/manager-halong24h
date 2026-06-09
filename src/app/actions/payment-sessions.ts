'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type {
  PaymentSession,
  PaymentSessionFilters,
} from '@/core/entities/payment-session';
import { paymentSessionRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

const MarkPaidSchema = z.object({
  sessionId: z.string().uuid(),
  reference: z.string().max(64).optional(),
});

export async function listPaymentSessionsAction(
  filters?: PaymentSessionFilters,
) {
  return toResult<PaymentSession[]>(async () => {
    await requireAdmin();
    return paymentSessionRepository().list(filters);
  });
}

export async function markPaymentSessionPaidAction(
  input: z.input<typeof MarkPaidSchema>,
) {
  return toResult<PaymentSession>(async () => {
    await requireAdmin();
    const parsed = MarkPaidSchema.parse(input);
    const session = await paymentSessionRepository().markPaid(parsed);
    revalidatePath('/admin/payments');
    return session;
  });
}
