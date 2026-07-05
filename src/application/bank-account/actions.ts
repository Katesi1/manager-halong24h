import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  BankAccountFilters,
  BankAccountQueueResult,
  BankAccountState,
} from '@/core/entities/bank-account';
import type { BankAccountRepository } from '../ports/bank-account-repository';

export async function getMyBankUseCase(
  repo: BankAccountRepository,
): Promise<BankAccountState> {
  return repo.getMine();
}

export async function listBankAccountsUseCase(
  repo: BankAccountRepository,
  filters?: BankAccountFilters,
): Promise<BankAccountQueueResult> {
  return repo.listQueue(filters);
}

export async function countPendingBankUseCase(
  repo: BankAccountRepository,
): Promise<number> {
  return repo.countPending();
}

/**
 * Spec §3.3: `bankBin` đúng 6 số NAPAS, `bankAccountNumber` 6–20 số,
 * `bankAccountName` bắt buộc; `bankName` optional.
 */
const SubmitSchema = z.object({
  bankBin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Mã ngân hàng (BIN) phải gồm đúng 6 chữ số'),
  bankName: z.string().trim().max(120).optional().or(z.literal('')),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, 'Số tài khoản phải gồm 6–20 chữ số'),
  bankAccountName: z
    .string()
    .trim()
    .min(2, 'Tên chủ tài khoản tối thiểu 2 ký tự')
    .max(120),
});

export async function submitMyBankUseCase(
  repo: BankAccountRepository,
  raw: unknown,
): Promise<BankAccountState> {
  const parsed = SubmitSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Thông tin tài khoản nhận tiền không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  const { bankName, ...rest } = parsed.data;
  return repo.submitMine({
    ...rest,
    ...(bankName ? { bankName } : {}),
  });
}

export async function approveBankUseCase(
  repo: BankAccountRepository,
  userId: string,
): Promise<void> {
  if (!userId) throw new ValidationError('Thiếu mã chủ nhà');
  return repo.approve(userId);
}

const RejectSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().min(5, 'Lý do tối thiểu 5 ký tự').max(500),
});

export async function rejectBankUseCase(
  repo: BankAccountRepository,
  raw: unknown,
): Promise<void> {
  const parsed = RejectSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu từ chối không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.reject(parsed.data);
}
