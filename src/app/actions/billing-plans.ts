'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type { Result } from '@/lib/result';
import type {
  BillingPlan,
  DeleteBillingPlanResult,
} from '@/core/entities/billing-plan';
import { billingPlanRepository } from '@/infrastructure/container';

function toError(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}

function revalidateAll() {
  revalidatePath('/admin/pricing');
  revalidatePath('/host/billing');
}

export async function listBillingPlansAction(): Promise<Result<BillingPlan[]>> {
  try {
    const data = await billingPlanRepository().list();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err, 'Không tải được danh sách gói cước') };
  }
}

export async function listAllBillingPlansAction(): Promise<Result<BillingPlan[]>> {
  try {
    const data = await billingPlanRepository().listAll();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err, 'Không tải được catalog gói cước') };
  }
}

/**
 * ID format: `rooms_<n>` hoặc slug snake/dash (vd `enterprise`, `rooms_test`).
 * BE chấp nhận tối đa 64 ký tự, lowercase, không khoảng trắng.
 */
const idSchema = z
  .string()
  .trim()
  .min(2)
  .max(64)
  .regex(/^[a-z0-9_-]+$/, 'ID chỉ chứa chữ thường, số, "_" và "-"');

const createSchema = z.object({
  id: idSchema,
  // rooms: -1 = không giới hạn (Enterprise). Số nguyên >= -1, <= 10_000.
  rooms: z.number().int().min(-1).max(10_000),
  monthlyPrice: z.number().int().min(0).max(1_000_000_000),
  yearlyPrice: z.number().int().min(0).max(10_000_000_000),
  features: z.array(z.string().trim().min(1).max(200)).max(20),
  active: z.boolean().optional(),
});

const updateSchema = createSchema.partial().omit({ id: true });

export async function createBillingPlanAction(
  input: unknown,
): Promise<Result<BillingPlan>> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dữ liệu không hợp lệ',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const data = await billingPlanRepository().create(parsed.data);
    revalidateAll();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err, 'Không tạo được gói cước') };
  }
}

export async function updateBillingPlanAction(
  id: string,
  input: unknown,
): Promise<Result<BillingPlan>> {
  const idCheck = idSchema.safeParse(id);
  if (!idCheck.success) return { ok: false, error: 'ID gói không hợp lệ' };

  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: 'Dữ liệu không hợp lệ',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  try {
    const data = await billingPlanRepository().update(idCheck.data, parsed.data);
    revalidateAll();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err, 'Không sửa được gói cước') };
  }
}

export async function deleteBillingPlanAction(
  id: string,
): Promise<Result<DeleteBillingPlanResult>> {
  const idCheck = idSchema.safeParse(id);
  if (!idCheck.success) return { ok: false, error: 'ID gói không hợp lệ' };
  try {
    const data = await billingPlanRepository().delete(idCheck.data);
    revalidateAll();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: toError(err, 'Không xoá được gói cước') };
  }
}
