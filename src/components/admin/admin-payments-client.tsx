'use client';

import Link from 'next/link';
import { Banknote, Wallet } from 'lucide-react';

import { PaymentsApproveView } from '@/components/admin/payments-approve-view';
import { PaymentsSubsView } from '@/components/admin/payments-subs-view';
import { buildPaymentsHref } from '@/components/admin/payments-shared';
import {
  isPaymentSessionActionable,
  type PaymentSession,
} from '@/core/entities/payment-session';
import type { ReceivingBankAccount } from '@/core/entities/platform-bank';
import type { Subscription } from '@/core/entities/subscription';
import { useApiResource } from '@/lib/use-api-resource';

type View = 'approve' | 'subs';

interface PaymentsData {
  allSubscriptions: Subscription[];
  overdueCount: number;
  paidThisMonth: number;
  allSessions: PaymentSession[];
  sessionError: string | null;
  receivingBank: ReceivingBankAccount;
  receivingBankError: string | null;
}

interface Props {
  view?: View;
  status?: string;
  q?: string;
  page: number;
}

/**
 * Gói cước chủ nhà fetch từ `/api/admin/payments` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. 2 view (đối soát / gói cước), count segmented client-side.
 */
export function AdminPaymentsClient({ view: requestedView, status, q, page }: Props) {
  const { loading, error, data } = useApiResource<PaymentsData>(
    `/api/admin/payments?q=${encodeURIComponent(q ?? '')}`,
  );

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        Không tải được dữ liệu gói cước: {error ?? 'Lỗi'}
      </div>
    );
  }

  const now = Date.now();
  const actionableSessions = data.allSessions.filter((s) =>
    isPaymentSessionActionable(s, now),
  );
  const approveCount = actionableSessions.length;
  const subsCount = data.allSubscriptions.length;
  const view: View = requestedView ?? (approveCount > 0 ? 'approve' : 'subs');

  const pageHref = (p: number) =>
    buildPaymentsHref({
      view,
      status,
      q,
      page: p > 1 ? String(p) : undefined,
    });

  return (
    <>
      <div className="mb-6 inline-flex rounded-xl bg-cream-100 p-1 ring-1 ring-ink-200/60">
        <Link
          href={buildPaymentsHref({ view: 'approve' })}
          className={
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ' +
            (view === 'approve'
              ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
              : 'text-ink-600 hover:text-ink-900')
          }
        >
          <Banknote className="h-4 w-4" />
          Chờ duyệt
          <span
            className={
              'rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular-nums ' +
              (approveCount > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-ink-100 text-ink-500')
            }
          >
            {approveCount}
          </span>
        </Link>
        <Link
          href={buildPaymentsHref({ view: 'subs' })}
          className={
            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ' +
            (view === 'subs'
              ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
              : 'text-ink-600 hover:text-ink-900')
          }
        >
          <Wallet className="h-4 w-4" />
          Tất cả gói cước
          <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-ink-500">
            {subsCount}
          </span>
        </Link>
      </div>

      {view === 'approve' ? (
        <PaymentsApproveView
          sessions={data.allSessions}
          actionableCount={approveCount}
          actionableTotal={actionableSessions.reduce(
            (sum, s) => sum + s.totalAmount,
            0,
          )}
          now={now}
          status={status}
          q={q}
          currentPage={page}
          pageHref={pageHref}
          error={data.sessionError ?? undefined}
          receivingBank={data.receivingBank}
          receivingBankError={data.receivingBankError ?? undefined}
        />
      ) : (
        <PaymentsSubsView
          subscriptions={data.allSubscriptions}
          paidThisMonth={data.paidThisMonth}
          overdueCount={data.overdueCount}
          status={status}
          q={q}
          currentPage={page}
          pageHref={pageHref}
        />
      )}
    </>
  );
}
