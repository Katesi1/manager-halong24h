/**
 * STK nền tảng nhận tiền mua gói (subscription) — spec §10.7 (v1.21).
 *
 * KHÁC với STK cọc của OWNER (§3.3, xem [[bank-account]]):
 *   - Đây là tài khoản của **platform Halong24h** (1 STK singleton).
 *   - Dùng sinh VietQR khi OWNER **mua/gia hạn gói cước**.
 *   - **KHÔNG có luồng duyệt** — ADMIN bấm lưu là áp ngay (audit
 *     `payment.receiving_bank_update`).
 *
 * `source`: `'env'` = chưa ai cấu hình (BE fallback biến môi trường) · `'db'` =
 * ADMIN đã lưu. `updatedAt` = null khi `source='env'`.
 */
export interface ReceivingBankAccount {
  bankBin: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  source: 'env' | 'db';
  updatedAt: string | null;
}

/** Input ADMIN cập nhật STK nền tảng — `PUT /admin/payments/receiving-bank`. */
export interface UpdateReceivingBankInput {
  bankBin: string;
  bankName?: string;
  bankAccountNumber: string;
  bankAccountName: string;
}
