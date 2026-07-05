import type {
  BankAccountFilters,
  BankAccountQueueResult,
  BankAccountState,
  RejectBankInput,
  SubmitBankInput,
} from '@/core/entities/bank-account';

/**
 * Tài khoản nhận tiền OWNER — luồng duyệt bởi ADMIN (spec §3.3, v1.21).
 *
 * OWNER: `GET`/`PUT /users/me/bank`.
 * ADMIN: `GET /admin/bank-accounts`, `POST /admin/users/:id/bank/approve|reject`.
 */
export interface BankAccountRepository {
  /** STK của chính chủ nhà đang đăng nhập — `GET /users/me/bank`. */
  getMine(): Promise<BankAccountState>;
  /** Gửi/sửa STK (ghi vào pending, chờ duyệt) — `PUT /users/me/bank`. */
  submitMine(input: SubmitBankInput): Promise<BankAccountState>;
  /** Queue duyệt cho ADMIN — `GET /admin/bank-accounts`. */
  listQueue(filters?: BankAccountFilters): Promise<BankAccountQueueResult>;
  /** Duyệt STK: copy pending → live — `POST /admin/users/:id/bank/approve`. */
  approve(userId: string): Promise<void>;
  /** Từ chối STK (giữ live cũ, lưu lý do) — `POST /admin/users/:id/bank/reject`. */
  reject(input: RejectBankInput): Promise<void>;
  /** Đếm hồ sơ chờ duyệt (badge sidebar) — dùng `pendingCount` từ listQueue. */
  countPending(): Promise<number>;
}
