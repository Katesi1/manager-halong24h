import type { KycStatusResponse } from '@/core/entities/kyc';

/**
 * KYC port — chỉ getStatus. Upload/submit thực hiện trên app mobile, web không gọi.
 */
export interface KycRepository {
  /** GET /kyc/status */
  getStatus(): Promise<KycStatusResponse>;
}
