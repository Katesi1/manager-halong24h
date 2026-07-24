'use server';

import { revalidatePath } from 'next/cache';

import {
  createYachtUseCase,
  deleteYachtUseCase,
  getYachtUseCase,
  listYachtsUseCase,
  updateYachtPricesUseCase,
  updateYachtUseCase,
} from '@/application/yachts/actions';
import type { YachtFilters } from '@/core/entities/yacht';
import { yachtRepository } from '@/infrastructure/container';
import type { Result } from '@/lib/result';
import { requireYachtManager } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Server Actions du thuyền — spec B1.
 *
 * Quyền: ADMIN + SALE hệ thống (role=2, scope=system) — `requireYachtManager`.
 * SALE owner-scope / OWNER / CUSTOMER → Forbidden (BE cũng 403 `yachts.forbidden`).
 */
function revalidateYachts(id?: string) {
  revalidatePath('/admin/yachts');
  if (id) revalidatePath(`/admin/yachts/${id}`);
}

export async function listYachtsAction(filters?: YachtFilters) {
  return toResult(async () => {
    await requireYachtManager();
    return listYachtsUseCase(yachtRepository(), filters);
  });
}

export async function getYachtAction(id: string) {
  return toResult(async () => {
    await requireYachtManager();
    return getYachtUseCase(yachtRepository(), id);
  });
}

export async function createYachtAction(
  raw: unknown,
): Promise<Result<{ id: string }>> {
  const result = await toResult(async () => {
    await requireYachtManager();
    return createYachtUseCase(yachtRepository(), raw);
  });
  if (result.ok) {
    revalidateYachts();
    return { ok: true, data: { id: result.data.id } };
  }
  return result;
}

export async function updateYachtAction(id: string, raw: unknown) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return updateYachtUseCase(yachtRepository(), id, raw);
  });
  if (result.ok) revalidateYachts(id);
  return result;
}

export async function updateYachtPricesAction(id: string, raw: unknown) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return updateYachtPricesUseCase(yachtRepository(), id, raw);
  });
  if (result.ok) revalidateYachts(id);
  return result;
}

export async function deleteYachtAction(id: string) {
  const result = await toResult(async () => {
    await requireYachtManager();
    return deleteYachtUseCase(yachtRepository(), id);
  });
  if (result.ok) revalidateYachts(id);
  return result;
}

export async function uploadYachtImagesAction(formData: FormData) {
  const id = formData.get('yachtId') as string;
  const files = formData
    .getAll('images')
    .filter((f): f is File => f instanceof File);
  const result = await toResult(async () => {
    await requireYachtManager();
    if (files.length === 0) {
      throw new Error('Chưa chọn ảnh nào để tải lên');
    }
    return yachtRepository().uploadImages(id, files);
  });
  if (result.ok) revalidateYachts(id);
  return result;
}

export async function deleteYachtImageAction(yachtId: string, imageId: string) {
  const result = await toResult(async () => {
    await requireYachtManager();
    await yachtRepository().deleteImage(yachtId, imageId);
  });
  if (result.ok) revalidateYachts(yachtId);
  return result;
}

export async function setYachtCoverImageAction(
  yachtId: string,
  imageId: string,
) {
  const result = await toResult(async () => {
    await requireYachtManager();
    await yachtRepository().setCoverImage(yachtId, imageId);
  });
  if (result.ok) revalidateYachts(yachtId);
  return result;
}
