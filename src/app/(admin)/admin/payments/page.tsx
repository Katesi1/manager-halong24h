import type { Metadata } from 'next';
import Link from 'next/link';
import { Search, Wallet } from 'lucide-react';

import {
  countOverdueSubscriptionsAction,
  listSubscriptionsAction,
  sumPaidSubscriptionsAction,
} from '@/app/actions/subscriptions';
import { PaymentsExport } from '@/components/admin/payments-export';
import { SubscriptionRowActions } from '@/components/admin/subscription-row-actions';
import { FormattedDate } from '@/components/common/formatted-date';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  type Subscription,
  type SubscriptionFilters,
  type SubscriptionStatus,
} from '@/core/entities/subscription';
import { planLabel } from '@/core/entities/billing-plan';
import { displayName, formatVND } from '@/lib/format';

function avatarColor(seed: string): string {
  const palette = [
    'bg-rose-100 text-rose-700',
    'bg-amber-100 text-amber-700',
    'bg-emerald-100 text-emerald-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
    'bg-fuchsia-100 text-fuchsia-700',
  ];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length]!;
}

export const metadata: Metadata = { title: 'Subscription chủ nhà' };

const PAGE_SIZE = 10;

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  none: 'Chưa có',
  trial: 'Trial',
  active: 'Đang hoạt động',
  past_due: 'Quá hạn',
  cancelled: 'Đã huỷ',
  frozen: 'Đã khoá',
  expired: 'Hết hạn',
};

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  none: 'default',
  trial: 'gold',
  active: 'success',
  past_due: 'danger',
  cancelled: 'default',
  frozen: 'dark',
  expired: 'warning',
};

const PLAN_VARIANT: Record<string, Parameters<typeof Badge>[0]['variant']> = {
  free: 'default',
  basic: 'info',
  standard: 'navy',
  pro: 'gold',
};

const TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'trial', label: 'Trial' },
  { key: 'active', label: 'Đang hoạt động' },
  { key: 'past_due', label: 'Quá hạn' },
  { key: 'expired', label: 'Hết hạn' },
  { key: 'frozen', label: 'Đã khoá' },
  { key: 'cancelled', label: 'Đã huỷ' },
  { key: 'none', label: 'Chưa có' },
];

function parseStatus(v: string | undefined): SubscriptionStatus | undefined {
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

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

export default async function AdminPaymentsPage(props: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const filters: SubscriptionFilters = {
    status: parseStatus(sp.status),
    search: sp.q?.trim() || undefined,
  };

  const { from, to } = monthRange();
  const [listResult, overdueResult, paidResult] = await Promise.all([
    listSubscriptionsAction(filters),
    countOverdueSubscriptionsAction(),
    sumPaidSubscriptionsAction(from, to),
  ]);

  const allSubscriptions: Subscription[] = listResult.ok ? listResult.data : [];
  const overdueCount = overdueResult.ok ? overdueResult.data : 0;
  const paidThisMonth = paidResult.ok ? paidResult.data : 0;

  const pendingTotal = allSubscriptions
    .filter((s) => s.status === 'past_due')
    .reduce((sum, s) => sum + s.amount, 0);
  const overdueTotal = pendingTotal;

  const currentPage = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const totalPages = Math.ceil(allSubscriptions.length / PAGE_SIZE);
  const paginated = allSubscriptions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function pageHref(page: number) {
    return buildHref('/admin/payments', {
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
        description="Trạng thái gói cước của từng chủ nhà (phí theo số phòng/kỳ). Đây là nguồn doanh thu duy nhất — khách thuê chuyển khoản trực tiếp cho chủ nhà, không qua hệ thống. Khi chủ nhà chuyển khoản phí, dùng nút bên dưới để đối soát rồi 'Ghi nhận thu' để gia hạn gói."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/payments/sessions"
              className="rounded-lg bg-amber-100 px-3.5 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200 hover:bg-amber-200"
            >
              💸 Đối soát chuyển khoản
            </Link>
            <PaymentsExport />
          </div>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Đã thu tháng này" value={formatVND(paidThisMonth)} />
        <StatCard
          label="Chờ thu"
          value={formatVND(pendingTotal)}
          hint={`${allSubscriptions.filter((s) => s.status === 'past_due').length} chủ nhà`}
        />
        <StatCard
          label="Quá hạn"
          value={formatVND(overdueTotal)}
          hint={`${overdueCount} chủ nhà`}
        />
        <StatCard
          label="Tổng kỳ hiện tại"
          value={String(allSubscriptions.length)}
        />
      </div>

      {/* Tabs + Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = (sp.status ?? '') === t.key;
            return (
              <Link
                key={t.key}
                href={buildHref('/admin/payments', {
                  status: t.key || undefined,
                  q: sp.q,
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
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q}
            placeholder="Tìm tên chủ nhà..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {/* Table */}
      {allSubscriptions.length === 0 ? (
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
          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-ink-200 bg-cream-50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Chủ nhà
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Gói cước
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Phòng
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Phí / kỳ
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Charge tiếp theo
                  </th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Trạng thái
                  </th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {paginated.map((s) => (
                  <tr key={s.id} className="transition-colors hover:bg-cream-50">
                    <td className="px-5 py-4">
                      {(() => {
                        const name = displayName(s.ownerName, s.ownerEmail);
                        const initial = name.charAt(0).toUpperCase() || '?';
                        const color = avatarColor(s.ownerId || name);
                        return (
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}
                            >
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <Link
                                href={`/admin/users/${s.ownerId}`}
                                className="font-semibold text-ink-900 hover:text-navy-900 hover:underline truncate block"
                              >
                                {name}
                              </Link>
                              <p className="text-[11px] text-ink-400 truncate">
                                {s.ownerEmail || `${s.ownerId.slice(0, 12)}…`}
                              </p>
                            </div>
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={PLAN_VARIANT[s.plan] ?? 'default'}>
                        {s.planId ? planLabel(s.planId) : '—'}
                      </Badge>
                      <p className="mt-1 text-[11px] text-ink-400">
                        {s.cycle === 'yearly' ? 'Theo năm' : 'Theo tháng'}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-ink-700">
                      {s.roomCount}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.amount > 0 ? (
                        <span className="font-mono text-sm font-bold tabular-nums text-emerald-700">
                          {formatVND(s.amount)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-ink-400">
                          Miễn phí
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-ink-500">
                      {s.expireAt ? <FormattedDate iso={s.expireAt} /> : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={STATUS_VARIANT[s.status]}>
                        {STATUS_LABEL[s.status]}
                      </Badge>
                      {s.note && (
                        <p
                          className="mt-1 max-w-[180px] text-[10px] text-ink-400 truncate"
                          title={s.note}
                        >
                          {s.note}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <SubscriptionRowActions
                        subscriptionId={s.id}
                        status={s.status}
                        amount={s.amount}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allSubscriptions.length}
            pageSize={PAGE_SIZE}
            buildHref={pageHref}
          />
        </>
      )}
    </div>
  );
}
