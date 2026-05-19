import type { KycStatusResponse } from '@/core/entities/kyc';
import type { KycRepository } from '../ports/kyc-repository';

export async function getKycStatusUseCase(
  repo: KycRepository,
): Promise<KycStatusResponse> {
  return repo.getStatus();
}
