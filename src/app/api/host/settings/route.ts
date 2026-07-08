import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getKycStatusAction } from '@/app/actions/kyc';
import type { KycStatusResponse } from '@/core/entities/kyc';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';

/**
 * BFF route (host) — trang Cài đặt cá nhân: profile (subset an toàn) + KYC
 * (OWNER). Client render banner + các card form.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const isOwner = profile.role === RoleCode.OWNER;
  let kyc: KycStatusResponse | null = null;
  if (isOwner) {
    const r = await getKycStatusAction();
    // kycBypass lấy thêm từ profile (BE /kyc/status có thể không trả field này).
    if (r.ok) kyc = { ...r.data, kycBypass: r.data.kycBypass || profile.kycBypass };
  }

  return NextResponse.json({
    data: {
      profile: {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phone: profile.phone ?? null,
        avatar: profile.avatar ?? null,
        role: profile.role,
        bankStatus: profile.bankStatus ?? null,
      },
      kyc,
    },
  });
}
