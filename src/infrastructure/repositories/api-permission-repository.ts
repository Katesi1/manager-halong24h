import 'server-only';

import {
  modulesForScope,
  type PermissionMatrix,
  type PermissionRow,
  type PermissionScope,
  type UpdatePermissionInput,
} from '@/core/entities/permission';
import type { PermissionRepository } from '@/application/ports/permission-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec §12 + §26.5 — `GET /permissions/:userId` trả `{ user: { scope, ... },
 * permissions: [...] }`. Shape cũ (mảng thuần / `{ permissions }` không có
 * `user`) vẫn được chấp nhận để backward-compat.
 */
type SpecPermissionResponse =
  | PermissionRow[]
  | {
      user?: { scope?: PermissionScope };
      permissions: PermissionRow[];
    };

function parse(data: SpecPermissionResponse): {
  rows: PermissionRow[];
  scope: PermissionScope | undefined;
} {
  if (Array.isArray(data)) return { rows: data, scope: undefined };
  return { rows: data.permissions ?? [], scope: data.user?.scope };
}

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
  raw: PermissionRow[],
  scope: PermissionScope | undefined,
): PermissionMatrix {
  const modules = modulesForScope(scope);
  const byModule = new Map<string, PermissionRow>();
  for (const r of raw) byModule.set(r.module, r);
  // Module chưa có row trong DB → default all-false (đúng semantic spec §26.5
  // cho admin-scope; owner-scope BE luôn trả đủ 4 row nên hiếm khi rơi vào).
  return {
    userId,
    scope,
    permissions: modules.map((m) => byModule.get(m) ?? emptyRow(m)),
  };
}

export class ApiPermissionRepository implements PermissionRepository {
  async getForUser(userId: string): Promise<PermissionMatrix> {
    const data = await apiClient.get<SpecPermissionResponse>(
      `/permissions/${userId}`,
      { cache: 'no-store' },
    );
    const { rows, scope } = parse(data);
    return fillDefaults(userId, rows, scope);
  }

  async update(input: UpdatePermissionInput): Promise<PermissionMatrix> {
    const data = await apiClient.put<SpecPermissionResponse>(
      `/permissions/${input.userId}`,
      { permissions: input.permissions },
    );
    const { rows, scope } = parse(data);
    return fillDefaults(input.userId, rows, scope);
  }
}
