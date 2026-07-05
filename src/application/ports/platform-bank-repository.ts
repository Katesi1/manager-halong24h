import type {
  ReceivingBankAccount,
  UpdateReceivingBankInput,
} from '@/core/entities/platform-bank';

/**
 * STK nền tảng nhận tiền mua gói (spec §10.7).
 * Guard BE: ADMIN / SALE hệ thống có quyền `payments`.
 */
export interface PlatformBankRepository {
  /** STK hiện hành — `GET /admin/payments/receiving-bank` (payments.canRead). */
  getReceiving(): Promise<ReceivingBankAccount>;
  /** Cập nhật STK — `PUT /admin/payments/receiving-bank` (payments.canUpdate). */
  updateReceiving(
    input: UpdateReceivingBankInput,
  ): Promise<ReceivingBankAccount>;
}
