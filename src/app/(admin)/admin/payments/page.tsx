import type { Metadata } from 'next';
import Link from 'next/link';
import { Banknote, Wallet } from 'lucide-react';

import { listPaymentSessionsAction } from '@/app/actions/payment-sessions';
import {
  countOverdueSubscriptionsAction,
  listSubscriptionsAction,
  sumPaidSubscriptionsAction,
} from '@/app/actions/subscriptions';
import { PaymentsApproveView } from '@/components/admin/payments-approve-view';
import { PaymentsExport } from '@/components/admin/payments-export';
import { PaymentsSubsView } from '@/components/admin/payments-subs-view';
import { buildPaymentsHref } from '@/components/admin/payments-shared';
import { PageHeader } from '@/components/host/page-header';
import {
  isPaymentSessionActionable,
  type PaymentSession,
} from '@/core/entities/payment-session';
import {
  type Subscription,
  type SubscriptionFilters,
} from '@/core/entities/subscription';

export const metadata: Metadata = { title: 'Gói cước chủ nhà' };

type View = 'approve' | 'subs';

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function AdminPaymentsPage(props: {
  searchParams: Promise<{
    view?: string;
    status?: string;
    q?: string;
    page?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const search = sp.q?.trim() || undefined;
  const subFilters: SubscriptionFilters = { search };

  const now = Date.now();
  const { from, to } = monthRange();

  // Fetch cả 2 nguồn: cần đủ count cho segmented control + bảng của view hiển
  // thị. Không filter status ở BE để count luôn là tổng (lọc status client-side
  // trong từng view).
  const [listResult, overdueResult, paidResult, sessionResult] =
    await Promise.all([
      listSubscriptionsAction(subFilters),
      countOverdueSubscriptionsAction(),
      sumPaidSubscriptionsAction(from, to),
      listPaymentSessionsAction({ search, limit: 100 }),
    ]);

  const allSubscriptions: Subscription[] = listResult.ok ? listResult.data : [];
  const overdueCount = overdueResult.ok ? overdueResult.data : 0;
  const paidThisMonth = paidResult.ok ? paidResult.data : 0;
  const allSessions: PaymentSession[] = sessionResult.ok
    ? sessionResult.data
    : [];

  const actionableSessions = allSessions.filter((s) =>
    isPaymentSessionActionable(s, now),
  );
  const approveCount = actionableSessions.length;
  const subsCount = allSubscriptions.length;

  // Default view: có session chờ duyệt → approve; ngược lại → subs.
  const requestedView =
    sp.view === 'approve' || sp.view === 'subs' ? sp.view : undefined;
  const view: View = requestedView ?? (approveCount > 0 ? 'approve' : 'subs');

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  function pageHref(page: number) {
    return buildPaymentsHref({
      view,
      status: sp.status,
      q: sp.q,
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Tài chính"
        title="Gói cước chủ nhà"
        description="Chủ nhà chuyển khoản mua gói → admin duyệt (xác nhận đã nhận tiền) → gói được kích hoạt. Đây là nguồn doanh thu duy nhất; khách thuê chuyển khoản trực tiếp cho chủ nhà, không qua hệ thống."
        actions={<PaymentsExport />}
      />

      {/* Segmented control: 2 view */}
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
          sessions={allSessions}
          actionableCount={approveCount}
          actionableTotal={actionableSessions.reduce(
            (sum, s) => sum + s.totalAmount,
            0,
          )}
          now={now}
          status={sp.status}
          q={sp.q}
          currentPage={currentPage}
          pageHref={pageHref}
          error={!sessionResult.ok ? sessionResult.error : undefined}
        />
      ) : (
        <PaymentsSubsView
          subscriptions={allSubscriptions}
          paidThisMonth={paidThisMonth}
          overdueCount={overdueCount}
          status={sp.status}
          q={sp.q}
          currentPage={currentPage}
          pageHref={pageHref}
        />
      )}
    </div>
  );
}
