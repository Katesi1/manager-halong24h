'use server';

import { revalidatePath } from 'next/cache';

import {
  getReceivingBankUseCase,
  updateReceivingBankUseCase,
} from '@/application/platform-bank/actions';
import { ValidationError } from '@/core/errors';
import { platformBankRepository } from '@/infrastructure/container';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { requireAdmin } from '@/lib/auth-guard';

import type { ActionResult } from './auth';
import { toResult } from './_helpers';

function flattenFieldErrors(
  fe?: Record<string, string[]>,
): Record<string, string> | undefined {
  if (!fe) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fe)) if (v[0]) out[k] = v[0];
  return Object.keys(out).length ? out : undefined;
}

/** STK nền tảng nhận tiền mua gói hiện hành — `GET /admin/payments/receiving-bank`. */
export async function getReceivingBankAction() {
  return toResult(async () => {
    await requireAdmin();
    return getReceivingBankUseCase(platformBankRepository());
  });
}

/**
 * ADMIN cập nhật STK nền tảng (form `useActionState`) — `PUT /admin/payments/
 * receiving-bank`. Áp dụng ngay, không có luồng duyệt.
 */
export async function updateReceivingBankAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireAdmin();
  } catch (raw) {
    return { error: mapApiErrorToDomain(raw).message };
  }

  const values = {
    bankBin: String(formData.get('bankBin') ?? '').trim(),
    bankName: String(formData.get('bankName') ?? '').trim(),
    bankAccountNumber: String(formData.get('bankAccountNumber') ?? '').trim(),
    bankAccountName: String(formData.get('bankAccountName') ?? '').trim(),
  };

  try {
    await updateReceivingBankUseCase(platformBankRepository(), values);
  } catch (raw) {
    if (raw instanceof ValidationError) {
      return {
        error: raw.message,
        fieldErrors: flattenFieldErrors(raw.fieldErrors),
        values,
      };
    }
    return { error: mapApiErrorToDomain(raw).message, values };
  }

  revalidatePath('/admin/payments');
  return { ok: true };
}
