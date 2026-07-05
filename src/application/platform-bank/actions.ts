import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type { ReceivingBankAccount } from '@/core/entities/platform-bank';
import type { PlatformBankRepository } from '../ports/platform-bank-repository';

export async function getReceivingBankUseCase(
  repo: PlatformBankRepository,
): Promise<ReceivingBankAccount> {
  return repo.getReceiving();
}

/**
 * Validate khớp BE (spec §10.7): bankBin đúng 6 số NAPAS, bankAccountNumber
 * 6–20 số, bankAccountName bắt buộc ≤100, bankName optional ≤100.
 */
const UpdateSchema = z.object({
  bankBin: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Mã ngân hàng (BIN) phải gồm đúng 6 chữ số'),
  bankName: z.string().trim().max(100).optional().or(z.literal('')),
  bankAccountNumber: z
    .string()
    .trim()
    .regex(/^\d{6,20}$/, 'Số tài khoản phải gồm 6–20 chữ số'),
  bankAccountName: z
    .string()
    .trim()
    .min(2, 'Tên chủ tài khoản tối thiểu 2 ký tự')
    .max(100, 'Tên chủ tài khoản tối đa 100 ký tự'),
});

export async function updateReceivingBankUseCase(
  repo: PlatformBankRepository,
  raw: unknown,
): Promise<ReceivingBankAccount> {
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Thông tin tài khoản nhận tiền không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  const { bankName, ...rest } = parsed.data;
  return repo.updateReceiving({
    ...rest,
    ...(bankName ? { bankName } : {}),
  });
}
