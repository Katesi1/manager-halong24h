import Link from 'next/link';
import { Wallet } from 'lucide-react';

import { SubscriptionsTable } from '@/components/admin/subscriptions-table';
import {
  PAYMENTS_PAGE_SIZE,
  buildPaymentsHref,
} from '@/components/admin/payments-shared';
import { StatCard } from '@/components/host/page-header';
import { Pagination } from '@/components/ui/pagination';
import {
  type Subscription,
  type SubscriptionStatus,
} from '@/core/entities/subscription';
import { formatVND } from '@/lib/format';

const SUB_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'trial', label: 'Trial' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'past_due', label: 'Quá hạn' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'frozen', label: 'Đã khoá' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'none', label: 'Chưa có' },
];

function parseSubStatus(v: string | undefined): SubscriptionStatus | undefined {
  const allowed: SubscriptionStatus[] = [
    'none',
    'trial',
    'active',
    'past_due',
    'cancelled',
    'frozen',
    'expired',
  ];
  return allowed.includes(v as SubscriptionStatus)
    ? (v as SubscriptionStatus)
    : undefined;
}

interface Props {
  subscriptions: Subscription[];
  paidThisMonth: number;
  overdueCount: number;
  status?: string;
  q?: string;
  currentPage: number;
  pageHref: (page: number) => string;
}

/** View "Tất cả gói cước" — trạng thái subscription của từng chủ nhà. */
export function PaymentsSubsView({
  subscriptions,
  paidThisMonth,
  overdueCount,
  status,
  q,
  currentPage,
  pageHref,
}: Props) {
  const subStatus = parseSubStatus(status);
  const filtered = subStatus
    ? subscriptions.filter((s) => s.status === subStatus)
    : subscriptions;

  const pastDue = subscriptions.filter((s) => s.status === 'past_due');
  const pendingTotal = pastDue.reduce((sum, s) => sum + s.amount, 0);

  const totalPages = Math.ceil(filtered.length / PAYMENTS_PAGE_SIZE);
  const paginated = filtered.slice(
    (currentPage - 1) * PAYMENTS_PAGE_SIZE,
    currentPage * PAYMENTS_PAGE_SIZE,
  );

  return (
    <>
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Đã thu tháng này" value={formatVND(paidThisMonth)} />
        <StatCard
          label="Chờ thu"
          value={formatVND(pendingTotal)}
          hint={`${pastDue.length} chủ nhà`}
        />
        <StatCard
          label="Quá hạn"
          value={formatVND(pendingTotal)}
          hint={`${overdueCount} chủ nhà`}
        />
        <StatCard label="Tổng" value={String(subscriptions.length)} />
      </div>

      {/* Tabs + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SUB_TABS.map((t) => {
            const active = (status ?? '') === t.key;
            return (
              <Link
                key={t.key}
                href={buildPaymentsHref({
                  view: 'subs',
                  status: t.key || undefined,
                  q,
                })}
                className={
                  'rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                {t.label}
              </Link>
            );
          })}
        </div>

        <form
          action="/admin/payments"
          method="get"
          className="relative max-w-xs w-full sm:w-auto"
        >
          <input type="hidden" name="view" value="subs" />
          {status && <input type="hidden" name="status" value={status} />}
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm tên chủ nhà..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Wallet className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Không có subscription phù hợp
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.
          </p>
        </div>
      ) : (
        <>
          <SubscriptionsTable subscriptions={paginated} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAYMENTS_PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </>
  );
}
