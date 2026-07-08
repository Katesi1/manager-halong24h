import 'server-only';

import type {
  KycStatusResponse,
  KycStatusValue,
  KycSubmission,
} from '@/core/entities/kyc';
import type { KycRepository } from '@/application/ports/kyc-repository';

import { apiClient } from '../http/api-client';

/**
 * Shape thật BE trả ở `GET /kyc/status` (spec §9.1 v1.7): field tên `status`
 * với vocab camelCase (`kycSubmitted|paymentPending|awaitingApproval|...`) +
 * `rejectReason` top-level. Mapper tolerant đọc cả tên field cũ/mới.
 */
interface RawKycStatus {
  kycStatus?: string;
  status?: string;
  submission?: KycSubmission | null;
  rejectReason?: string | null;
  kycBypass?: boolean;
}

/** BE vocab camelCase → FE vocab snake_case; giá trị khác giữ nguyên. */
const STATUS_ALIAS: Record<string, KycStatusValue> = {
  kycSubmitted: 'kyc_submitted',
  paymentPending: 'payment_pending',
  awaitingApproval: 'awaiting_approval',
};

export class ApiKycRepository implements KycRepository {
  async getStatus(): Promise<KycStatusResponse> {
    const raw = await apiClient.get<RawKycStatus>('/kyc/status', {
      cache: 'no-store',
    });
    const s = raw.kycStatus ?? raw.status ?? 'none';
    return {
      kycStatus: STATUS_ALIAS[s] ?? (s as KycStatusValue),
      submission: raw.submission ?? null,
      rejectReason: raw.rejectReason ?? null,
      kycBypass: raw.kycBypass ?? false,
    };
  }
}
