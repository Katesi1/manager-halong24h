import 'server-only';

import {
  PERMISSION_MODULES,
  type PermissionMatrix,
  type PermissionRow,
  type UpdatePermissionInput,
} from '@/core/entities/permission';
import type { PermissionRepository } from '@/application/ports/permission-repository';

import { apiClient } from '../http/api-client';

function emptyRow(module: PermissionRow['module']): PermissionRow {
  return {
    module,
    canCreate: false,
    canRead: false,
    canUpdate: false,
    canDelete: false,
  };
}

function fillDefaults(
  userId: string,
  raw: PermissionRow[] | undefined,
): PermissionMatrix {
  const byModule = new Map<string, PermissionRow>();
  for (const r of raw ?? []) byModule.set(r.module, r);
  // Cảnh báo khi BE trả thiếu module — phân biệt "user thực sự không có quyền"
  // (empty array hợp lệ cho non-SALE, spec v1.3 §22 A6) với "BE bug trả thiếu".
  // Non-SALE thì raw có thể rỗng — đó là hợp lệ, không warn. Chỉ warn khi raw
  // có ít nhất 1 row nhưng thiếu module so với PERMISSION_MODULES.
  if (
    raw &&
    raw.length > 0 &&
    raw.length < PERMISSION_MODULES.length &&
    process.env.NODE_ENV !== 'production'
  ) {
    const missing = PERMISSION_MODULES.filter((m) => !byModule.has(m));
    console.warn('[permissions] BE trả thiếu module — fill bằng emptyRow', {
      userId,
      missing,
    });
  }
  return {
    userId,
    permissions: PERMISSION_MODULES.map((m) => byModule.get(m) ?? emptyRow(m)),
  };
}

export class ApiPermissionRepository implements PermissionRepository {
  async getForUser(userId: string): Promise<PermissionMatrix> {
    const data = await apiClient.get<
      PermissionRow[] | { permissions: PermissionRow[] }
    >(`/permissions/${userId}`, { cache: 'no-store' });
    const arr = Array.isArray(data) ? data : data.permissions;
    return fillDefaults(userId, arr);
  }

  async update(input: UpdatePermissionInput): Promise<PermissionMatrix> {
    const data = await apiClient.put<
      PermissionRow[] | { permissions: PermissionRow[] }
    >(`/permissions/${input.userId}`, { permissions: input.permissions });
    const arr = Array.isArray(data) ? data : data.permissions;
    return fillDefaults(input.userId, arr);
  }
}
