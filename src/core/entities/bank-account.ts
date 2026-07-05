/**
 * Tài khoản nhận tiền OWNER — luồng duyệt bởi ADMIN (spec §3.3, v1.21).
 *
 * OWNER tạo/sửa STK ngân hàng (dùng sinh VietQR cho khách trả cọc) **phải được
 * ADMIN duyệt** mới có hiệu lực. Giá trị đang chờ duyệt (`pending`) KHÔNG được
 * dùng sinh VietQR — chỉ giá trị đã duyệt (`current`, `bankStatus='approved'`).
 *
 * Trạng thái: `none` (chưa cấu hình) → `pending` (đã gửi, chờ duyệt) →
 * `approved` (đã duyệt, live) | `rejected` (bị từ chối, giữ giá trị duyệt trước).
 */

export type BankStatus = 'none' | 'pending' | 'approved' | 'rejected';

/** 4 field STK — mọi field nullable khi chưa từng cấu hình / chưa gửi. */
export interface BankDetails {
  /** Mã NAPAS 6 số. */
  bankBin: string | null;
  bankName: string | null;
  /** 6–20 số. */
  bankAccountNumber: string | null;
  bankAccountName: string | null;
}

/**
 * Trạng thái STK của chính chủ nhà — `GET`/`PUT /users/me/bank` (§3.3).
 * `current` = giá trị đã duyệt (đang dùng VietQR); `pending` != null chỉ khi
 * `status='pending'`; `rejectReason` != null chỉ khi `status='rejected'`.
 */
export interface BankAccountState {
  status: BankStatus;
  current: BankDetails;
  pending: BankDetails | null;
  rejectReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

/** 1 dòng trong queue duyệt của ADMIN — `GET /admin/bank-accounts` (§3.3). */
export interface BankAccountQueueItem {
  /** = userId của chủ nhà. */
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  status: BankStatus;
  current: BankDetails;
  pending: BankDetails | null;
  rejectReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
}

/** Bộ lọc queue admin — khớp `status` query của BE. */
export type BankQueueFilter = 'pending' | 'approved' | 'rejected' | 'all';

export interface BankAccountFilters {
  filter?: BankQueueFilter;
  page?: number;
  limit?: number;
  /** Tìm theo tên / email / SĐT (client-side hoặc BE, tuỳ hỗ trợ). */
  search?: string;
}

export interface BankAccountQueueResult {
  filter: BankQueueFilter;
  /** Số hồ sơ chờ duyệt — dùng badge sidebar. */
  pendingCount: number;
  total: number;
  page: number;
  limit: number;
  items: BankAccountQueueItem[];
}

/** Input OWNER gửi STK — `PUT /users/me/bank`. */
export interface SubmitBankInput {
  bankBin: string;
  bankName?: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface RejectBankInput {
  /** userId của chủ nhà. */
  userId: string;
  reason: string;
}

export const BANK_STATUS_LABEL: Record<BankStatus, string> = {
  none: 'Chưa cấu hình',
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

const EMPTY_DETAILS: BankDetails = {
  bankBin: null,
  bankName: null,
  bankAccountNumber: null,
  bankAccountName: null,
};

/** True khi 4 field STK đều rỗng (chưa nhập gì). */
export function isBankDetailsEmpty(d: BankDetails | null | undefined): boolean {
  if (!d) return true;
  return (
    !d.bankBin && !d.bankName && !d.bankAccountNumber && !d.bankAccountName
  );
}

export function emptyBankDetails(): BankDetails {
  return { ...EMPTY_DETAILS };
}
