import type {
  ApproveKycInput,
  KycAdminFilters,
  KycAdminSubmission,
  RejectKycInput,
} from '@/core/entities/kyc-admin';

export interface KycAdminRepository {
  list(filters?: KycAdminFilters): Promise<KycAdminSubmission[]>;
  getById(id: string): Promise<KycAdminSubmission | null>;
  approve(input: ApproveKycInput): Promise<KycAdminSubmission>;
  reject(input: RejectKycInput): Promise<KycAdminSubmission>;
  /** Đếm pending để hiển thị badge dashboard */
  countPending(): Promise<number>;
}
