'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getPropertyByIdUseCase } from '@/application/properties/get-by-id';
import { updatePropertyUseCase } from '@/application/properties/update';
import { propertyRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { DomainError } from '@/core/errors';

/**
 * Admin moderation actions cho property (BE chỉ có isActive boolean, chưa có
 * trường moderationStatus / rejectedReason riêng). Hiện tại:
 *  - approve = update isActive = true
 *  - reject  = update isActive = false  (lý do log riêng audit, khi BE bổ sung)
 *  - suspend = update isActive = false
 *
 * Khi BE bổ sung trường `moderationStatus` + `rejectedReason`, update use case.
 */
export interface AdminActionResult {
  ok?: boolean;
  error?: string;
}

async function withAdminGuard<T>(
  fn: (profile: Awaited<ReturnType<typeof requireAdmin>>) => Promise<T>,
): Promise<T | AdminActionResult> {
  try {
    const profile = await requireAdmin();
    return await fn(profile);
  } catch (raw) {
    const err = raw instanceof DomainError ? raw : mapApiErrorToDomain(raw);
    return {
      ok: false,
      error: err.message || 'Có lỗi xảy ra',
    } as AdminActionResult & T;
  }
}

export async function approvePropertyAction(
  propertyId: string,
): Promise<AdminActionResult> {
  return withAdminGuard(async (profile) => {
    const before = await getPropertyByIdUseCase(propertyRepository(), propertyId);
    await updatePropertyUseCase(propertyRepository(), propertyId, {
      isActive: true,
    });
    revalidatePath('/admin/properties');
    revalidatePath(`/admin/properties/${propertyId}`);
    return { ok: true };
  });
}

export async function rejectPropertyAction(
  propertyId: string,
  _prev: AdminActionResult,
  formData: FormData,
): Promise<AdminActionResult> {
  return withAdminGuard(async (profile) => {
    const reason = z
      .string()
      .min(5, 'Nêu lý do tối thiểu 5 ký tự')
      .safeParse(formData.get('reason'));
    if (!reason.success) {
      return { error: reason.error.issues[0]?.message ?? 'Lý do bắt buộc' };
    }
    const before = await getPropertyByIdUseCase(propertyRepository(), propertyId);
    await updatePropertyUseCase(propertyRepository(), propertyId, {
      isActive: false,
    });
    // TODO: khi BE thêm field rejectedReason, gọi update đính kèm
    revalidatePath('/admin/properties');
    revalidatePath(`/admin/properties/${propertyId}`);
    return { ok: true };
  });
}

export async function suspendPropertyAction(
  propertyId: string,
  suspend: boolean,
): Promise<AdminActionResult> {
  return withAdminGuard(async (profile) => {
    const before = await getPropertyByIdUseCase(propertyRepository(), propertyId);
    await updatePropertyUseCase(propertyRepository(), propertyId, {
      isActive: !suspend,
    });
    if (suspend) {
    }
    revalidatePath('/admin/properties');
    revalidatePath(`/admin/properties/${propertyId}`);
    return { ok: true };
  });
}
