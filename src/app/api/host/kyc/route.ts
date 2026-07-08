import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getKycStatusAction } from '@/app/actions/kyc';
import type { KycStatusValue } from '@/core/entities/kyc';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';

/**
 * BFF route (host) — trạng thái KYC của chủ nhà. OWNER: fetch `/kyc/status`;
 * role khác trả `isOwner:false`. Client render form/banner tương ứng.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const isOwner = profile.role === RoleCode.OWNER;
  if (!isOwner) {
    return NextResponse.json({
      data: { isOwner: false, kycStatus: 'none' as KycStatusValue, kycBypass: false },
    });
  }

  const r = await getKycStatusAction();
  return NextResponse.json({
    data: {
      isOwner: true,
      kycStatus: r.ok ? r.data.kycStatus : ('none' as KycStatusValue),
      kycBypass: (r.ok && r.data.kycBypass) || profile.kycBypass,
    },
  });
}
