import type {
  GuestDetail,
  GuestFilters,
  PaginatedGuests,
} from '@/core/entities/guest';

export interface GuestRepository {
  /** Auth (ADMIN/OWNER/SALE) — GET /guests (search + label filter + paginate). */
  list(filters?: GuestFilters): Promise<PaginatedGuests>;
  /** Auth — GET /guests/:id. Trả `null` khi 404 (không tồn tại / không phải CUSTOMER). */
  getById(id: string): Promise<GuestDetail | null>;
}
