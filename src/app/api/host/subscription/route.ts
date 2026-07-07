import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { isManagerRole } from '@/core/value-objects/role';
import { blockedReason } from '@/lib/subscription-guard';

/**
 * BFF route (host) — gói cước của chủ nhà + lý do bị chặn (nếu có). Client
 * render card gói cước.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const result = await getMySubscriptionAction();
  const sub = result.ok ? result.data : null;
  return NextResponse.json({ data: { sub, blocked: blockedReason(sub) } });
}
