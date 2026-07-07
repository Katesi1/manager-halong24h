import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import {
  listAllBillingPlansAction,
  listBillingPlansAction,
} from '@/app/actions/billing-plans';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — danh mục gói (public preview + admin catalog). */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const [publicResult, adminResult] = await Promise.all([
    listBillingPlansAction(),
    listAllBillingPlansAction(),
  ]);

  return NextResponse.json({
    data: {
      publicPlans: publicResult.ok ? publicResult.data : [],
      publicError: publicResult.ok ? null : publicResult.error,
      adminPlans: adminResult.ok ? adminResult.data : [],
      adminError: adminResult.ok ? null : adminResult.error,
    },
  });
}
