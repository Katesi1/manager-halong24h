'use server';

import { revalidatePath } from 'next/cache';

import {
  banUserUseCase,
  getAdminUserUseCase,
  listAdminUsersUseCase,
  resetPasswordUseCase,
  revokeSessionUseCase,
  unbanUserUseCase,
  updateSubscriptionUseCase,
} from '@/application/admin-users/actions';
import type { AdminUserFilters } from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';
import { adminUserRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

const PLAN_LABEL: Record<'free' | 'basic' | 'standard' | 'pro', string> = {
  free: 'Miễn phí',
  basic: 'Cơ bản',
  standard: 'Tiêu chuẩn',
  pro: 'Cao cấp',
};

const ROLE_LABEL: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: 'Quản trị',
  [RoleCode.OWNER]: 'Chủ nhà',
  [RoleCode.SALE]: 'Nhân viên',
  [RoleCode.CUSTOMER]: 'Khách',
};

function isValidRole(v: number): v is RoleCode {
  return (
    v === RoleCode.ADMIN ||
    v === RoleCode.OWNER ||
    v === RoleCode.SALE ||
    v === RoleCode.CUSTOMER
  );
}

export async function listAdminUsersAction(filters?: AdminUserFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listAdminUsersUseCase(adminUserRepository(), filters);
  });
}

export async function getAdminUserAction(id: string) {
  return toResult(async () => {
    await requireAdmin();
    return getAdminUserUseCase(adminUserRepository(), id);
  });
}

export async function banAdminUserAction(userId: string, reason: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const user = await banUserUseCase(adminUserRepository(), { userId, reason });
    return user;
  });
  if (result.ok) {
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
  }
  return result;
}

export async function unbanAdminUserAction(userId: string) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const user = await unbanUserUseCase(adminUserRepository(), userId);
    return user;
  });
  if (result.ok) {
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
  }
  return result;
}

export async function revokeUserSessionAction(userId: string) {
  return toResult(async () => {
    const profile = await requireAdmin();
    const user = await getAdminUserUseCase(adminUserRepository(), userId);
    await revokeSessionUseCase(adminUserRepository(), userId);
    return true;
  });
}

export async function updateUserSubscriptionAction(
  userId: string,
  plan: 'free' | 'basic' | 'standard' | 'pro',
) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    const user = await updateSubscriptionUseCase(adminUserRepository(), {
      userId,
      plan,
    });
    return user;
  });
  if (result.ok) {
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
  }
  return result;
}

/**
 * Mock-only: ghi audit log + revalidate. BE chưa expose PATCH /admin/users/:id/role.
 * Khi BE ready, gọi use-case thực thay vì chỉ ghi audit.
 */
export async function changeUserRoleAction(
  userId: string,
  fromRole: number,
  toRole: number,
) {
  const result = await toResult(async () => {
    const profile = await requireAdmin();
    if (!Number.isFinite(fromRole) || !isValidRole(fromRole)) {
      throw new Error('Vai trò hiện tại không hợp lệ');
    }
    if (!Number.isFinite(toRole) || !isValidRole(toRole)) {
      throw new Error('Vai trò mới không hợp lệ');
    }
    if (fromRole === toRole) {
      throw new Error('Vai trò mới trùng vai trò hiện tại');
    }
    const user = await getAdminUserUseCase(adminUserRepository(), userId);
    return true;
  });
  if (result.ok) {
    revalidatePath('/admin/users');
    revalidatePath(`/admin/users/${userId}`);
  }
  return result;
}

export async function resetUserPasswordAction(userId: string) {
  return toResult(async () => {
    const profile = await requireAdmin();
    const user = await getAdminUserUseCase(adminUserRepository(), userId);
    await resetPasswordUseCase(adminUserRepository(), userId);
    return true;
  });
}
