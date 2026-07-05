/**
 * Permission matrix — spec §12 + §26.2 (System SALE).
 *
 * Mỗi SALE có 1 row mỗi module cho 4 quyền CRUD.
 *
 * Hai nhóm module theo `User.scope`:
 *  - `owner`  (SALE thuộc chủ nhà): 4 module owner-scope.
 *  - `system` (Sale hệ thống, admin-grade): 4 owner-scope + 14 admin-scope,
 *    default ALL false — ADMIN phải cấp tường minh (spec §26.5).
 */

export type PermissionScope = 'owner' | 'system';

export type OwnerPermissionModule =
  | 'properties'
  | 'bookings'
  | 'calendar'
  | 'reviews';

export type AdminPermissionModule =
  | 'users'
  | 'kyc'
  | 'subscriptions'
  | 'payments'
  | 'disputes'
  | 'reviewsModeration'
  | 'propertiesModeration'
  | 'audit'
  | 'leads'
  | 'support'
  | 'emails'
  | 'billing'
  | 'appVersion'
  | 'dashboard';

export type PermissionModule = OwnerPermissionModule | AdminPermissionModule;

/** Owner-scope (legacy, spec §12) — giữ tên cũ vì nhiều nơi đang import. */
export const PERMISSION_MODULES: PermissionModule[] = [
  'properties',
  'bookings',
  'calendar',
  'reviews',
];

/** Admin-scope (spec §26.2) — chỉ áp dụng cho SALE `scope=system`. */
export const ADMIN_PERMISSION_MODULES: PermissionModule[] = [
  'users',
  'kyc',
  'subscriptions',
  'payments',
  'disputes',
  'reviewsModeration',
  'propertiesModeration',
  'audit',
  'leads',
  'support',
  'emails',
  'billing',
  'appVersion',
  'dashboard',
];

export const ALL_PERMISSION_MODULES: PermissionModule[] = [
  ...PERMISSION_MODULES,
  ...ADMIN_PERMISSION_MODULES,
];

export interface PermissionRow {
  module: PermissionModule;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface PermissionMatrix {
  userId: string;
  /**
   * Scope của user (spec §26.5 — `GET /permissions/:userId` trả kèm
   * `user.scope`). `undefined` khi BE chưa trả (backward-compat) → coi là owner.
   */
  scope?: PermissionScope;
  permissions: PermissionRow[];
}

export interface UpdatePermissionInput {
  userId: string;
  permissions: PermissionRow[];
}

export const PERMISSION_MODULE_LABEL: Record<PermissionModule, string> = {
  // Owner-scope
  properties: 'Cơ sở',
  bookings: 'Booking',
  calendar: 'Lịch',
  reviews: 'Review',
  // Admin-scope (spec §26.2)
  users: 'Người dùng',
  kyc: 'Duyệt KYC',
  subscriptions: 'Gói cước chủ nhà',
  payments: 'Đối soát thanh toán',
  disputes: 'Khiếu nại',
  reviewsModeration: 'Kiểm duyệt review',
  propertiesModeration: 'Duyệt cơ sở',
  audit: 'Nhật ký hệ thống',
  leads: 'Khách tiềm năng',
  support: 'Hỗ trợ',
  emails: 'Email hệ thống',
  billing: 'Danh mục gói cước',
  appVersion: 'Phiên bản app',
  dashboard: 'Báo cáo hệ thống',
};

/** Danh sách module áp dụng cho user theo scope (spec §26.5). */
export function modulesForScope(
  scope: PermissionScope | undefined,
): PermissionModule[] {
  return scope === 'system' ? ALL_PERMISSION_MODULES : PERMISSION_MODULES;
}
