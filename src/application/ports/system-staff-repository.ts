import type {
  CreateSystemSaleInput,
  SystemSale,
  SystemSaleFilters,
  UpdateSystemSaleInput,
} from '@/core/entities/system-sale';

/** Spec §26 — quản lý System SALE (ADMIN). */
export interface SystemStaffRepository {
  /** GET /admin/system-staff (§26.3) — trả kèm `permissions[]` mỗi user. */
  list(filters?: SystemSaleFilters): Promise<SystemSale[]>;
  /** POST /users { role: 2, scope: "system" } — tạo trực tiếp (spec §26.4). */
  create(input: CreateSystemSaleInput): Promise<SystemSale>;
  /**
   * PUT /users/:id — sửa name/email/phone (+ password nếu đổi) trong 1 call.
   * BE nhận `password` trực tiếp trong body (admin sửa được anyone).
   */
  update(input: UpdateSystemSaleInput): Promise<void>;
  /** DELETE /users/:id — ADMIN xoá user (spec §3). */
  remove(userId: string): Promise<void>;
}
