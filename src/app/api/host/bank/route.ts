import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMyBankAction } from '@/app/actions/bank-accounts';
import type { BankAccountState } from '@/core/entities/bank-account';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';

/**
 * BFF route (host) — tài khoản nhận tiền của chủ nhà. OWNER: fetch
 * `/users/me/bank`; role khác trả `isOwner:false`. Client render form/notice.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const isOwner = profile.role === RoleCode.OWNER;
  if (!isOwner) {
    return NextResponse.json({
      data: { isOwner: false, state: null as BankAccountState | null, error: null },
    });
  }

  const result = await getMyBankAction();
  return NextResponse.json({
    data: {
      isOwner: true,
      state: result.ok ? result.data : null,
      error: result.ok ? null : result.error,
    },
  });
}
