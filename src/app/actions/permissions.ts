'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import {
  ALL_PERMISSION_MODULES,
  type PermissionMatrix,
  type PermissionModule,
} from '@/core/entities/permission';
import { permissionRepository } from '@/infrastructure/container';
import { requireAdmin } from '@/lib/auth-guard';

import { toResult } from './_helpers';

const RowSchema = z.object({
  // Nhận cả owner-scope + admin-scope module — BE tự validate theo scope của
  // target user (spec §26.5: scope=owner mà gửi admin-scope module → 400).
  module: z.enum(
    ALL_PERMISSION_MODULES as [PermissionModule, ...PermissionModule[]],
  ),
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  canDelete: z.boolean(),
});

const UpdateSchema = z.object({
  userId: z.string().uuid(),
  permissions: z.array(RowSchema),
});

export async function getPermissionsAction(userId: string) {
  return toResult<PermissionMatrix>(async () => {
    await requireAdmin();
    return permissionRepository().getForUser(userId);
  });
}

export async function updatePermissionsAction(
  input: z.input<typeof UpdateSchema>,
) {
  return toResult<PermissionMatrix>(async () => {
    await requireAdmin();
    const parsed = UpdateSchema.parse(input);
    const matrix = await permissionRepository().update(parsed);
    revalidatePath(`/admin/users/${parsed.userId}`);
    revalidatePath('/admin/permissions');
    return matrix;
  });
}
