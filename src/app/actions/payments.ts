'use server';

import { listPaymentsUseCase } from '@/application/payments/list';
import type { PaymentFilters } from '@/core/entities/payment';
import { paymentRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Payments (subscription chủ nhà) — admin-only. Hiện tại MOCK; khi BE ra
 * endpoint, đổi `paymentRepository()` trong container.ts.
 */
export async function listPaymentsAction(filters?: PaymentFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listPaymentsUseCase(paymentRepository(), filters);
  });
}
