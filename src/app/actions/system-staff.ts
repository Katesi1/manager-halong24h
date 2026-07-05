'use server';

import { revalidatePath } from 'next/cache';

import {
  createSystemSaleUseCase,
  deleteSystemSaleUseCase,
  listSystemSalesUseCase,
  updateSystemSaleUseCase,
} from '@/application/system-staff/actions';
import type { SystemSaleFilters } from '@/core/entities/system-sale';
import { systemStaffRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Server Actions — Tài khoản Sale hệ thống (spec §26). Chỉ ADMIN.
 *
 * System SALE tạo xong KHÔNG có quyền gì — ADMIN cấp qua trang Phân quyền
 * (`/admin/permissions?userId=`, PUT /permissions/:userId với 18 module).
 */

const PAGE = '/admin/system-staff';

export async function listSystemSalesAction(filters?: SystemSaleFilters) {
  return toResult(async () => {
    await requireAdmin();
    return listSystemSalesUseCase(systemStaffRepository(), filters);
  });
}

export async function createSystemSaleAction(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const result = await toResult(async () => {
    await requireAdmin();
    return createSystemSaleUseCase(systemStaffRepository(), input);
  });
  if (result.ok) {
    revalidatePath(PAGE);
    revalidatePath('/admin/users');
  }
  return result;
}

export async function updateSystemSaleAction(input: {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  newPassword?: string;
}) {
  const result = await toResult(async () => {
    await requireAdmin();
    await updateSystemSaleUseCase(systemStaffRepository(), input);
    return true;
  });
  if (result.ok) {
    revalidatePath(PAGE);
    revalidatePath('/admin/users');
  }
  return result;
}

export async function deleteSystemSaleAction(userId: string) {
  const result = await toResult(async () => {
    await requireAdmin();
    await deleteSystemSaleUseCase(systemStaffRepository(), userId);
    return true;
  });
  if (result.ok) {
    revalidatePath(PAGE);
    revalidatePath('/admin/users');
  }
  return result;
}
