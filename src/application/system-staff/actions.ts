import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  SystemSale,
  SystemSaleFilters,
} from '@/core/entities/system-sale';
import type { SystemStaffRepository } from '../ports/system-staff-repository';

/** Use cases quản lý System SALE — spec §26. Chỉ ADMIN gọi (guard ở action). */

export async function listSystemSalesUseCase(
  repo: SystemStaffRepository,
  filters?: SystemSaleFilters,
): Promise<SystemSale[]> {
  return repo.list(filters);
}

const NameSchema = z.string().trim().min(2, 'Tên tối thiểu 2 ký tự').max(100);
const EmailSchema = z.string().trim().email('Email không hợp lệ');
const PhoneSchema = z
  .string()
  .trim()
  .regex(/^0\d{9,10}$/, 'SĐT không hợp lệ (bắt đầu bằng 0, 10-11 số)')
  .optional()
  .or(z.literal('').transform(() => undefined));
const PasswordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(72)
  .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, 'Mật khẩu phải có cả chữ và số');

const CreateSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  password: PasswordSchema,
});

export async function createSystemSaleUseCase(
  repo: SystemStaffRepository,
  raw: unknown,
): Promise<SystemSale> {
  const parsed = CreateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu tài khoản không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.create(parsed.data);
}

const UpdateSchema = z.object({
  userId: z.string().uuid(),
  name: NameSchema,
  email: EmailSchema,
  phone: PhoneSchema,
  isActive: z.boolean(),
  // Để trống = không đổi mật khẩu.
  newPassword: PasswordSchema.optional().or(
    z.literal('').transform(() => undefined),
  ),
});

export async function updateSystemSaleUseCase(
  repo: SystemStaffRepository,
  raw: unknown,
): Promise<void> {
  const parsed = UpdateSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu tài khoản không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  await repo.update(parsed.data);
}

export async function deleteSystemSaleUseCase(
  repo: SystemStaffRepository,
  userId: string,
): Promise<void> {
  if (!z.string().uuid().safeParse(userId).success) {
    throw new ValidationError('userId không hợp lệ');
  }
  await repo.remove(userId);
}
