import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listPaymentSessionsAction } from '@/app/actions/payment-sessions';
import { getReceivingBankAction } from '@/app/actions/platform-bank';
import {
  countOverdueSubscriptionsAction,
  listSubscriptionsAction,
  sumPaidSubscriptionsAction,
} from '@/app/actions/subscriptions';
import type { ReceivingBankAccount } from '@/core/entities/platform-bank';
import { isAdmin } from '@/core/value-objects/role';

function monthRange(now: Date): { from: string; to: string } {
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

const FALLBACK_BANK: ReceivingBankAccount = {
  bankBin: null,
  bankName: null,
  bankAccountNumber: null,
  bankAccountName: null,
  source: 'env',
  updatedAt: null,
};

/** BFF route (ADMIN) — gói cước chủ nhà: subscriptions + sessions + STK. */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const search = new URL(request.url).searchParams.get('q')?.trim() || undefined;
  const { from, to } = monthRange(new Date());

  const [listResult, overdueResult, paidResult, sessionResult, bankResult] =
    await Promise.all([
      listSubscriptionsAction({ search }),
      countOverdueSubscriptionsAction(),
      sumPaidSubscriptionsAction(from, to),
      listPaymentSessionsAction({ search, limit: 100 }),
      getReceivingBankAction(),
    ]);

  return NextResponse.json({
    data: {
      allSubscriptions: listResult.ok ? listResult.data : [],
      overdueCount: overdueResult.ok ? overdueResult.data : 0,
      paidThisMonth: paidResult.ok ? paidResult.data : 0,
      allSessions: sessionResult.ok ? sessionResult.data : [],
      sessionError: sessionResult.ok ? null : sessionResult.error,
      receivingBank: bankResult.ok ? bankResult.data : FALLBACK_BANK,
      receivingBankError: bankResult.ok ? null : bankResult.error,
    },
  });
}
