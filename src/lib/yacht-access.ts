import { RoleCode } from '@/core/value-objects/role';

/** Người dùng đủ quyền quản lý du thuyền (client-safe predicate). */
export interface YachtManagerLike {
  role: number;
  scope?: 'owner' | 'system' | null;
}

/**
 * ADMIN + SALE hệ thống (role=2, scope=system) quản lý du thuyền (spec B).
 * SALE owner-scope KHÔNG được (BE 403 `yachts.forbidden`).
 */
export function canManageYachts(p: YachtManagerLike): boolean {
  return (
    p.role === RoleCode.ADMIN ||
    (p.role === RoleCode.SALE && p.scope === 'system')
  );
}

/** SALE hệ thống (không phải ADMIN) — dùng để giới hạn sidebar về mảng du thuyền. */
export function isSystemSale(p: YachtManagerLike): boolean {
  return p.role === RoleCode.SALE && p.scope === 'system';
}
