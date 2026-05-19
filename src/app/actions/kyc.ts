'use server';

import { getKycStatusUseCase } from '@/application/kyc/actions';
import { kycRepository } from '@/infrastructure/container';
import { requireOwner } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * KYC web — chỉ đọc trạng thái. Upload/submit thực hiện trên app mobile.
 */
export async function getKycStatusAction() {
  return toResult(async () => {
    await requireOwner();
    return getKycStatusUseCase(kycRepository());
  });
}
