'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  approvePropertyUseCase,
  rejectPropertyUseCase,
  setPropertyHotUseCase,
  suspendPropertyUseCase,
} from '@/application/properties/moderate';
import { propertyRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { DomainError } from '@/core/errors';

/**
 * Admin moderation actions cho property (spec §4.4 + §4.10).
 * Vòng đời duyệt: pending → approved | rejected; approved → suspended;
 * rejected/suspended → approved (duyệt lại / mở lại).
 */
export interface AdminActionResult {
  ok?: boolean;
  error?: string;
}

async function withAdminGuard(
  fn: () => Promise<AdminActionResult>,
): Promise<AdminActionResult> {
  try {
    await requireAdmin();
    return await fn();
  } catch (raw) {
    const err = raw instanceof DomainError ? raw : mapApiErrorToDomain(raw);
    return {
      ok: false,
      error: err.message || 'Có lỗi xảy ra',
    };
  }
}

function revalidateProperty(propertyId: string) {
  revalidatePath('/admin/properties');
  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath('/admin');
}

const PropertyIdSchema = z.string().uuid('Mã cơ sở không hợp lệ');

const RejectSchema = z.object({
  propertyId: PropertyIdSchema,
  reason: z
    .string()
    .trim()
    .min(5, 'Lý do từ chối phải có ít nhất 5 ký tự')
    .max(500, 'Lý do từ chối tối đa 500 ký tự'),
});

/** Duyệt cơ sở: pending/rejected/suspended → approved. */
export async function approvePropertyAction(
  propertyId: string,
): Promise<AdminActionResult> {
  if (!PropertyIdSchema.safeParse(propertyId).success) {
    return { ok: false, error: 'Mã cơ sở không hợp lệ' };
  }
  return withAdminGuard(async () => {
    await approvePropertyUseCase(propertyRepository(), propertyId);
    revalidateProperty(propertyId);
    return { ok: true };
  });
}

/** Từ chối cơ sở đang chờ duyệt (bắt buộc lý do ≥5 ký tự). */
export async function rejectPropertyAction(
  propertyId: string,
  reason: string,
): Promise<AdminActionResult> {
  const parsed = RejectSchema.safeParse({ propertyId, reason });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ',
    };
  }
  return withAdminGuard(async () => {
    await rejectPropertyUseCase(
      propertyRepository(),
      parsed.data.propertyId,
      parsed.data.reason,
    );
    revalidateProperty(propertyId);
    return { ok: true };
  });
}

/** Tạm ngưng cơ sở đang approved (lý do tuỳ chọn). */
export async function suspendPropertyAction(
  propertyId: string,
  reason?: string,
): Promise<AdminActionResult> {
  if (!PropertyIdSchema.safeParse(propertyId).success) {
    return { ok: false, error: 'Mã cơ sở không hợp lệ' };
  }
  const trimmed = reason?.trim();
  return withAdminGuard(async () => {
    await suspendPropertyUseCase(
      propertyRepository(),
      propertyId,
      trimmed && trimmed.length > 0 ? trimmed : undefined,
    );
    revalidateProperty(propertyId);
    return { ok: true };
  });
}

/** Bật/tắt badge "Hot" (admin curated). */
export async function setPropertyHotAction(
  propertyId: string,
  isHot: boolean,
): Promise<AdminActionResult> {
  if (!PropertyIdSchema.safeParse(propertyId).success) {
    return { ok: false, error: 'Mã cơ sở không hợp lệ' };
  }
  return withAdminGuard(async () => {
    await setPropertyHotUseCase(propertyRepository(), propertyId, isHot);
    revalidateProperty(propertyId);
    return { ok: true };
  });
}
