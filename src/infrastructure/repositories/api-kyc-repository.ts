import 'server-only';

import type { KycStatusResponse } from '@/core/entities/kyc';
import type { KycRepository } from '@/application/ports/kyc-repository';

import { apiClient } from '../http/api-client';

export class ApiKycRepository implements KycRepository {
  async getStatus(): Promise<KycStatusResponse> {
    return apiClient.get<KycStatusResponse>('/kyc/status', {
      cache: 'no-store',
    });
  }
}
