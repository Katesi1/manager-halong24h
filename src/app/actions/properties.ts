'use server';

import { revalidatePath } from 'next/cache';

import { createPropertyUseCase } from '@/application/properties/create';
import { deletePropertyUseCase } from '@/application/properties/delete';
import { getPropertyByIdUseCase } from '@/application/properties/get-by-id';
import {
  deletePropertyImageUseCase,
  setPropertyCoverImageUseCase,
  uploadPropertyImagesUseCase,
} from '@/application/properties/images';
import { listPropertiesUseCase } from '@/application/properties/list';
import {
  updatePropertyPricesUseCase,
  updatePropertyUseCase,
} from '@/application/properties/update';
import type { PropertyFilters } from '@/core/entities/property';
import { propertyRepository } from '@/infrastructure/container';
import type { Result } from '@/lib/result';
import {
  requireManagerRole,
  requireOwnerOfProperty,
} from '@/lib/auth-guard';

import { toResult } from './_helpers';

export async function listPropertiesAction(filters?: PropertyFilters) {
  return toResult(async () => {
    await requireManagerRole();
    return listPropertiesUseCase(propertyRepository(), filters);
  });
}

export async function getPropertyAction(id: string) {
  return toResult(async () => {
    // Đọc property: chỉ chủ sở hữu hoặc ADMIN. SALE được nếu cùng owner group.
    await requireOwnerOfProperty(id);
    return getPropertyByIdUseCase(propertyRepository(), id);
  });
}

export async function createPropertyAction(
  raw: unknown,
): Promise<Result<{ id: string }>> {
  const result = await toResult(async () => {
    // Tạo mới: bất kỳ manager nào (OWNER tự tạo của mình; ADMIN có thể tạo cho người khác).
    await requireManagerRole();
    return createPropertyUseCase(propertyRepository(), raw);
  });
  if (result.ok) {
    revalidatePath('/host/properties');
    revalidatePath('/admin/properties');
    return { ok: true, data: { id: result.data.id } };
  }
  return result;
}

export async function updatePropertyAction(id: string, raw: unknown) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(id);
    return updatePropertyUseCase(propertyRepository(), id, raw);
  });
  if (result.ok) {
    revalidatePath('/host/properties');
    revalidatePath(`/host/properties/${id}`);
    revalidatePath('/admin/properties');
  }
  return result;
}

export async function updatePropertyPricesAction(id: string, raw: unknown) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(id);
    return updatePropertyPricesUseCase(propertyRepository(), id, raw);
  });
  if (result.ok) {
    revalidatePath(`/host/properties/${id}`);
  }
  return result;
}

export async function deletePropertyAction(id: string) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(id);
    return deletePropertyUseCase(propertyRepository(), id);
  });
  if (result.ok) {
    revalidatePath('/host/properties');
    revalidatePath('/admin/properties');
  }
  return result;
}

export async function uploadPropertyImagesAction(
  id: string,
  formData: FormData,
) {
  const files = formData
    .getAll('images')
    .filter((f): f is File => f instanceof File);
  const result = await toResult(async () => {
    await requireOwnerOfProperty(id);
    return uploadPropertyImagesUseCase(propertyRepository(), id, files);
  });
  if (result.ok) revalidatePath(`/host/properties/${id}`);
  return result;
}

export async function deletePropertyImageAction(
  propertyId: string,
  imageId: string,
) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(propertyId);
    return deletePropertyImageUseCase(
      propertyRepository(),
      propertyId,
      imageId,
    );
  });
  if (result.ok) revalidatePath(`/host/properties/${propertyId}`);
  return result;
}

export async function setPropertyCoverImageAction(
  propertyId: string,
  imageId: string,
) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(propertyId);
    return setPropertyCoverImageUseCase(
      propertyRepository(),
      propertyId,
      imageId,
    );
  });
  if (result.ok) revalidatePath(`/host/properties/${propertyId}`);
  return result;
}
