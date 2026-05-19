import 'server-only';

import { getCurrentProfile } from '@/app/actions/auth';
import type {
  KycStatusResponse,
  KycSubmissionStatus,
} from '@/core/entities/kyc';
import type { KycStatus } from '@/core/entities/user';
import type { KycRepository } from '@/application/ports/kyc-repository';

/** Map UserProfile.kycStatus (4-state) sang KycSubmissionStatus | 'none'. */
function mapStatus(s: KycStatus | undefined): KycSubmissionStatus | 'none' {
  switch (s) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'pending':
      return 'awaiting_approval';
    case 'none':
    default:
      return 'none';
  }
}

export class MockKycRepository implements KycRepository {
  async getStatus(): Promise<KycStatusResponse> {
    // Đọc từ profile hiện hành để mock đồng bộ với UI dev (DEV_BYPASS_AUTH).
    // Nếu profile chưa có kycStatus → 'none'.
    const profile = await getCurrentProfile();
    return {
      kycStatus: mapStatus(profile?.kycStatus),
      submission: null,
      kycBypass: profile?.kycBypass ?? false,
    };
  }
}
