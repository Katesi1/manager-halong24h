import type {
  ApproveKycInput,
  KycAdminFilters,
  KycAdminListResult,
  KycAdminSubmission,
  RejectKycInput,
} from '@/core/entities/kyc-admin';

export interface KycAdminRepository {
  list(filters?: KycAdminFilters): Promise<KycAdminListResult>;
  getById(id: string): Promise<KycAdminSubmission | null>;
  approve(input: ApproveKycInput): Promise<KycAdminSubmission>;
  reject(input: RejectKycInput): Promise<KycAdminSubmission>;
  /**
   * Đếm pending để hiển thị badge dashboard.
   * Spec v1.11: dùng `pendingCount` trong response của `list()` thay vì
   * gọi riêng. Endpoint `/admin/kyc/count-pending` deprecated nhưng vẫn chạy.
   */
  countPending(): Promise<number>;
}
