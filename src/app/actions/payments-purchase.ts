'use server';

import { startPlanPaymentUseCase } from '@/application/payments/purchase';
import { paymentPurchaseRepository } from '@/infrastructure/container';
import { requireOwner } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * OWNER bắt đầu thanh toán 1 gói cước — spec §10.2 (`/payments/*` OWNER-only).
 * Quote → initiate → trả STK nền tảng THẬT + QR + ckContent để render dialog.
 * `rooms` KHÔNG nhận từ client — use case suy từ planId (chống thao túng giá).
 * Guard `requireOwner` (fail-closed ở FE, khớp @Roles(OWNER) của BE).
 */
export async function startPlanPaymentAction(input: {
  planId: string;
  cycle: 'monthly' | 'yearly';
}) {
  return toResult(async () => {
    await requireOwner();
    return startPlanPaymentUseCase(paymentPurchaseRepository(), input);
  });
}
