import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  AdminUser,
  AdminUserFilters,
} from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';
import type { AdminUserRepository } from '../ports/admin-user-repository';

export async function listAdminUsersUseCase(
  repo: AdminUserRepository,
  filters?: AdminUserFilters,
): Promise<AdminUser[]> {
  return repo.list(filters);
}

export async function getAdminUserUseCase(
  repo: AdminUserRepository,
  id: string,
): Promise<AdminUser | null> {
  if (!id) return null;
  return repo.getById(id);
}

const BanSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự').max(500),
});

export async function banUserUseCase(
  repo: AdminUserRepository,
  raw: unknown,
): Promise<AdminUser> {
  const parsed = BanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu ban không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.ban(parsed.data);
}

export async function unbanUserUseCase(
  repo: AdminUserRepository,
  userId: string,
): Promise<AdminUser> {
  if (!userId) throw new ValidationError('Thiếu userId');
  return repo.unban({ userId });
}

export async function revokeSessionUseCase(
  repo: AdminUserRepository,
  userId: string,
): Promise<void> {
  if (!userId) throw new ValidationError('Thiếu userId');
  await repo.revokeSession({ userId });
}

const PlanSchema = z.object({
  userId: z.string().min(1),
  plan: z.enum(['free', 'basic', 'standard', 'pro']),
});

export async function updateSubscriptionUseCase(
  repo: AdminUserRepository,
  raw: unknown,
): Promise<AdminUser> {
  const parsed = PlanSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu gói cước không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.updateSubscription(parsed.data);
}

const RoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.union([
    z.literal(RoleCode.ADMIN),
    z.literal(RoleCode.OWNER),
    z.literal(RoleCode.SALE),
    z.literal(RoleCode.CUSTOMER),
  ]),
});

export async function updateRoleUseCase(
  repo: AdminUserRepository,
  raw: unknown,
): Promise<AdminUser> {
  const parsed = RoleSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu vai trò không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.updateRole(parsed.data);
}

const KycBypassSchema = z.object({
  userId: z.string().uuid(),
  bypass: z.boolean(),
});

export async function setKycBypassUseCase(
  repo: AdminUserRepository,
  raw: unknown,
): Promise<AdminUser> {
  const parsed = KycBypassSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu quyền KYC không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.setKycBypass(parsed.data);
}

export async function resetPasswordUseCase(
  repo: AdminUserRepository,
  userId: string,
): Promise<void> {
  if (!userId) throw new ValidationError('Thiếu userId');
  await repo.resetPassword(userId);
}
