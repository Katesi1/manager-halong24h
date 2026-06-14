'use server';

import { revalidatePath } from 'next/cache';

import { updatePropertyUseCase } from '@/application/properties/update';
import { propertyRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { DomainError } from '@/core/errors';

/**
 * Admin moderation actions cho property.
 *
 * Không còn luồng "duyệt cơ sở": OWNER đã KYC tạo phòng là active ngay
 * (BE set isActive=true khi tạo). Admin chỉ còn quyền tạm khoá / mở khoá:
 *  - suspend = update isActive = false (tạm khoá cơ sở vi phạm)
 *  - unsuspend = update isActive = true (mở khoá)
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

export async function suspendPropertyAction(
  propertyId: string,
  suspend: boolean,
): Promise<AdminActionResult> {
  return withAdminGuard(async () => {
    await updatePropertyUseCase(propertyRepository(), propertyId, {
      isActive: !suspend,
    });
    revalidatePath('/admin/properties');
    revalidatePath(`/admin/properties/${propertyId}`);
    return { ok: true };
  });
}
