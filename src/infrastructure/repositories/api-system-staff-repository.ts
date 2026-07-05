import 'server-only';

import type {
  CreateSystemSaleInput,
  SystemSale,
  SystemSaleFilters,
  UpdateSystemSaleInput,
} from '@/core/entities/system-sale';
import type { PermissionRow } from '@/core/entities/permission';
import type { SystemStaffRepository } from '@/application/ports/system-staff-repository';

import { apiClient } from '../http/api-client';

/**
 * List lấy từ `GET /admin/system-staff` (spec §26.3 — trả kèm `permissions[]`
 * mỗi user để hiển thị tóm tắt quyền ngay trong bảng). BE tự lọc role=SALE +
 * scope=system. `POST /users` (§26.4) trả cùng shape (không có createdAt).
 */
interface SpecSystemSale {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: number;
  scope?: string | null;
  isActive?: boolean;
  createdAt?: string;
  permissions?: PermissionRow[];
}

function mapSale(s: SpecSystemSale): SystemSale {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone ?? null,
    isActive: s.isActive ?? true,
    // '' → formatDate() render '—' (guard sẵn trong lib/format).
    createdAt: s.createdAt ?? '',
    permissions: s.permissions ?? [],
  };
}

export class ApiSystemStaffRepository implements SystemStaffRepository {
  async list(filters?: SystemSaleFilters): Promise<SystemSale[]> {
    // Spec §26.3 — `GET /admin/system-staff?isActive=true|false|all`. Trả kèm
    // `permissions[]` mỗi user. `all` để browser tự lọc/đếm tab in-memory.
    const isActive =
      filters?.isActive === undefined ? 'all' : String(filters.isActive);
    const data = await apiClient.get<
      SpecSystemSale[] | { items: SpecSystemSale[] }
    >('/admin/system-staff', {
      query: { isActive },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr
      // BE đã lọc role=SALE + scope=system; chỉ lọc phòng thủ khi field có mặt.
      .filter((r) => r.role === undefined || r.role === 2)
      .filter((r) => r.scope == null || r.scope === 'system')
      .map(mapSale);
  }

  async create(input: CreateSystemSaleInput): Promise<SystemSale> {
    // Spec §26.4 — chỉ ADMIN. scope=system + role≠2 → BE 400.
    const data = await apiClient.post<SpecSystemSale>('/users', {
      name: input.name,
      email: input.email,
      phone: input.phone,
      password: input.password,
      role: 2,
      scope: 'system',
    });
    return mapSale(data);
  }

  async update(input: UpdateSystemSaleInput): Promise<void> {
    // Spec §3 — `PUT /users/:id` admin sửa được người khác. BE nhận cả
    // `password` trong body; `undefined` bị JSON.stringify loại bỏ → không đổi.
    await apiClient.put(`/users/${input.userId}`, {
      name: input.name,
      email: input.email,
      phone: input.phone,
      isActive: input.isActive,
      password: input.newPassword,
    });
  }

  async remove(userId: string): Promise<void> {
    // Spec §3 — `DELETE /users/:id` (ADMIN). Response { data: null }.
    await apiClient.delete(`/users/${userId}`);
  }
}
