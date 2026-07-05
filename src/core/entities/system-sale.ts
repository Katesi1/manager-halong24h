import type { PermissionRow } from './permission';

/**
 * System SALE — spec §26 (v1.15).
 *
 * SALE hệ thống (admin-grade): cùng `role=2` nhưng `scope="system"`,
 * `ownerId=null`, data scope toàn hệ thống. Default KHÔNG có quyền gì —
 * ADMIN cấp tường minh qua `PUT /permissions/:userId` (18 module).
 */
export interface SystemSale {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  /** Hydrated per user từ `GET /admin/system-staff` (spec §26.3). */
  permissions: PermissionRow[];
}

export interface SystemSaleFilters {
  /** `undefined` = all (BE default). */
  isActive?: boolean;
}

/** Spec §26.4 — ADMIN tạo trực tiếp qua `POST /users` với scope=system. */
export interface CreateSystemSaleInput {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

/**
 * ADMIN sửa thông tin System SALE — `PUT /users/:id` (admin sửa được người
 * khác). BE nhận `password` ngay trong body — đổi mật khẩu cùng 1 request.
 */
export interface UpdateSystemSaleInput {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  /** Hoạt động (true) / Tạm khóa (false) — BE nhận `isActive` trong PUT body. */
  isActive: boolean;
  /** Để trống = giữ mật khẩu cũ. */
  newPassword?: string;
}
