import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listBillingPlansAction } from '@/app/actions/billing-plans';
import { listPropertiesAction } from '@/app/actions/properties';
import {
  getMySubscriptionAction,
  listMyInvoicesAction,
} from '@/app/actions/subscriptions';
import { isManagerRole } from '@/core/value-objects/role';

/** BFF route (host) — trang gói cước: sub + plans + invoices + số phòng. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const [propertiesResult, subResult, plansResult, invoicesResult] =
    await Promise.all([
      listPropertiesAction({ includeInactive: true }),
      getMySubscriptionAction(),
      listBillingPlansAction(),
      listMyInvoicesAction(),
    ]);

  return NextResponse.json({
    data: {
      roomCount: propertiesResult.ok ? propertiesResult.data.length : 0,
      sub: subResult.ok ? subResult.data : null,
      plans: plansResult.ok ? plansResult.data : [],
      plansError: plansResult.ok ? null : plansResult.error,
      invoices: invoicesResult.ok ? invoicesResult.data : [],
      invoicesError: invoicesResult.ok ? null : invoicesResult.error,
    },
  });
}
