/**
 * Guest — hồ sơ khách hàng (CUSTOMER) cùng thống kê đặt phòng.
 *
 * BE tự tổng hợp từ user role CUSTOMER + lịch sử booking. `label` là nhãn nội
 * bộ do BE tính theo heuristic (số lần đặt, huỷ, tình trạng ban…):
 *  - vip        : khách giá trị cao (nhiều booking hoàn tất)
 *  - regular    : khách quen (đã có lịch sử ổn định)
 *  - new        : khách mới
 *  - restricted : khách bị hạn chế (huỷ nhiều / đã ban)
 *
 * 2 endpoint:
 *  - GET /guests        (Auth ADMIN/OWNER/SALE) — list + filter + paginate
 *  - GET /guests/:id    (404 nếu không tồn tại / không phải CUSTOMER) — kèm
 *    `recentBookings` (tối đa 50).
 */

export type GuestLabel = 'vip' | 'regular' | 'new' | 'restricted';

/** Thống kê đặt phòng của khách. */
export interface GuestStats {
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

/** Một dòng trong lịch sử đặt phòng gần đây của khách (GET /guests/:id). */
export interface GuestBookingRow {
  id: string;
  propertyId: string;
  checkinDate: string;
  checkoutDate: string;
  /** Trạng thái thô từ BE (numeric 0-4 hoặc string). */
  status: number | string;
  totalAmount: number | null;
  paidAmount: number | null;
  createdAt: string;
  property: {
    id: string;
    name: string;
    code: string | null;
  };
}

/** Hồ sơ khách (dùng chung list item + detail). */
export interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  bannedAt: string | null;
  bannedReason: string | null;
  createdAt: string;
  updatedAt: string;
  stats: GuestStats;
  lastBookingAt: string | null;
  label: GuestLabel;
}

/** Item trong danh sách khách (alias rõ nghĩa cho list view). */
export type GuestListItem = Guest;

/** Hồ sơ chi tiết — kèm lịch sử đặt phòng gần đây. */
export interface GuestDetail extends Guest {
  recentBookings: GuestBookingRow[];
}

export interface GuestFilters {
  /** Tìm theo tên / SĐT / email (≤ 100 ký tự). */
  q?: string;
  label?: GuestLabel;
  page?: number;
  limit?: number;
}

/** Kết quả phân trang từ GET /guests. */
export interface PaginatedGuests {
  items: GuestListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Nhãn tiếng Việt cho `GuestLabel` — dùng cho badge UI. */
export const GUEST_LABEL_LABEL: Record<GuestLabel, string> = {
  vip: 'VIP',
  regular: 'Khách quen',
  new: 'Khách mới',
  restricted: 'Hạn chế',
};
