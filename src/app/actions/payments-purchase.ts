'use server';

import { startPlanPaymentUseCase } from '@/application/payments/purchase';
import { paymentPurchaseRepository } from '@/infrastructure/container';
import { requireManagerRole } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * OWNER bắt đầu thanh toán 1 gói cước — spec §10.2.
 * Quote → initiate → trả STK nền tảng THẬT + QR + ckContent để render dialog.
 * BE enforce OWNER-only; SALE/khác sẽ nhận lỗi từ BE (hiện trong dialog).
 */
export async function startPlanPaymentAction(input: {
  planId: string;
  cycle: 'monthly' | 'yearly';
  rooms: number;
}) {
  return toResult(async () => {
    await requireManagerRole();
    return startPlanPaymentUseCase(paymentPurchaseRepository(), input);
  });
}
