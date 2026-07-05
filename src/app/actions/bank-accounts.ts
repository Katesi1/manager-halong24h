'use server';

import { revalidatePath } from 'next/cache';

import {
  approveBankUseCase,
  countPendingBankUseCase,
  getMyBankUseCase,
  listBankAccountsUseCase,
  rejectBankUseCase,
  submitMyBankUseCase,
} from '@/application/bank-account/actions';
import type { BankAccountFilters } from '@/core/entities/bank-account';
import { ValidationError } from '@/core/errors';
import { bankAccountRepository } from '@/infrastructure/container';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { requireAdmin, requireOwner } from '@/lib/auth-guard';

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

// ─── OWNER ───

/** STK nhận tiền của chính chủ nhà — `GET /users/me/bank`. */
export async function getMyBankAction() {
  return toResult(async () => {
    await requireOwner();
    return getMyBankUseCase(bankAccountRepository());
  });
}

/**
 * OWNER gửi/sửa STK (form `useActionState`) — `PUT /users/me/bank`.
 * Ghi vào pending + chờ ADMIN duyệt; KHÔNG kích hoạt ngay.
 */
export async function submitMyBankAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await requireOwner();
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
    await submitMyBankUseCase(bankAccountRepository(), values);
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

  revalidatePath('/host/settings/bank');
  revalidatePath('/host/settings');
  return { ok: true };
}

// ─── ADMIN ───

export async function listBankAccountsAction(filters?: BankAccountFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listBankAccountsUseCase(bankAccountRepository(), filters);
  });
}

export async function countPendingBankAccountsAction() {
  return toResult(async () => {
    await requireAdmin();
    return countPendingBankUseCase(bankAccountRepository());
  });
}

export async function approveBankAccountAction(userId: string) {
  const result = await toResult(async () => {
    await requireAdmin();
    return approveBankUseCase(bankAccountRepository(), userId);
  });
  if (result.ok) {
    revalidatePath('/admin/bank-accounts');
    revalidatePath('/admin');
  }
  return result;
}

export async function rejectBankAccountAction(userId: string, reason: string) {
  const result = await toResult(async () => {
    await requireAdmin();
    return rejectBankUseCase(bankAccountRepository(), { userId, reason });
  });
  if (result.ok) {
    revalidatePath('/admin/bank-accounts');
    revalidatePath('/admin');
  }
  return result;
}
