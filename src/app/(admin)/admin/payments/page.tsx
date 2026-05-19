import type { Metadata } from 'next';
import Link from 'next/link';

import {
  countOverdueSubscriptionsAction,
  listSubscriptionsAction,
  sumPaidSubscriptionsAction,
} from '@/app/actions/subscriptions';
import { PaymentsDateChips } from '@/components/admin/payments-date-chips';
import { PaymentsExport } from '@/components/admin/payments-export';
import { SubscriptionRowActions } from '@/components/admin/subscription-row-actions';
import { FormattedDate } from '@/components/common/formatted-date';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  PLAN_LABEL,
  type Subscription,
  type SubscriptionFilters,
  type SubscriptionStatus,
} from '@/core/entities/subscription';
import { formatVND } from '@/lib/format';

export const metadata: Metadata = { title: 'Subscription chủ nhà' };

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  paid: 'Đã thu',
  pending: 'Chờ thu',
  overdue: 'Quá hạn',
  frozen: 'Đã khoá',
};

const STATUS_VARIANT: Record<
  SubscriptionStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  paid: 'success',
  pending: 'warning',
  overdue: 'danger',
  frozen: 'dark',
};

function parseStatus(v: string | undefined): SubscriptionStatus | undefined {
  if (v === 'paid' || v === 'pending' || v === 'overdue' || v === 'frozen') {
    return v;
  }
  return undefined;
}

function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

export default async function AdminPaymentsPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
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

  const subscriptions: Subscription[] = listResult.ok ? listResult.data : [];
  const overdueCount = overdueResult.ok ? overdueResult.data : 0;
  const paidThisMonth = paidResult.ok ? paidResult.data : 0;

  const pendingTotal = subscriptions
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.amount, 0);
  const overdueTotal = subscriptions
    .filter((s) => s.status === 'overdue')
    .reduce((sum, s) => sum + s.amount, 0);

  const activeFilters = [filters.status, filters.search].filter(Boolean).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Tài chính"
        title="Subscription chủ nhà"
        description="Doanh thu hệ thống = phí gói cước chủ nhà trả theo số phòng. Hệ thống KHÔNG còn lấy hoa hồng trên đặt phòng — khách trả trực tiếp cho chủ nhà."
        actions={<PaymentsExport />}
      />

      <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
        ℹ️ Mô hình mới: chủ nhà KYC 7 yếu tố → khách chuyển khoản trực tiếp qua
        STK đã xác minh. Cuộc chat + bill lưu trong hệ thống để giải quyết khiếu nại.
        Halong24h thu phí cố định mỗi phòng/tháng, không liên quan đến giá đặt phòng.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Đã thu tháng này" value={formatVND(paidThisMonth)} />
        <StatCard
          label="Chờ thu"
          value={formatVND(pendingTotal)}
          hint={`${subscriptions.filter((s) => s.status === 'pending').length} chủ nhà`}
        />
        <StatCard
          label="Quá hạn"
          value={formatVND(overdueTotal)}
          hint={`${overdueCount} quá hạn`}
        />
        <StatCard
          label="Tổng kỳ trong list"
          value={String(subscriptions.length)}
        />
      </div>

      <div className="mt-6 mb-3">
        <PaymentsDateChips />
      </div>

      <form
        className="mb-3 rounded-2xl bg-white p-4 ring-1 ring-ink-200/60 shadow-card grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        action="/admin/payments"
      >
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">
            Trạng thái
          </label>
          <select
            name="status"
            defaultValue={filters.status ?? ''}
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          >
            <option value="">Tất cả</option>
            <option value="paid">Đã thu</option>
            <option value="pending">Chờ thu</option>
            <option value="overdue">Quá hạn</option>
            <option value="frozen">Đã khoá</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-500 mb-1">
            Tìm theo tên chủ nhà
          </label>
          <input
            type="search"
            name="q"
            defaultValue={filters.search ?? ''}
            placeholder="VD: Trần Đức Tuấn"
            className="h-9 w-full rounded-md border border-ink-200 bg-white px-3 text-sm"
          />
        </div>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="h-9 rounded-md bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Lọc
          </button>
          {activeFilters > 0 && (
            <Link
              href="/admin/payments"
              className="h-9 inline-flex items-center rounded-md border border-ink-200 px-3 text-sm text-ink-700 hover:bg-cream-100"
            >
              Xoá
            </Link>
          )}
        </div>
      </form>

      <section>
        {subscriptions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-ink-200/60 shadow-card">
            <p className="text-2xl">💸</p>
            <p className="mt-2 text-sm font-medium text-ink-900">
              Không có subscription phù hợp
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full text-sm">
              <thead className="border-b border-ink-200 bg-cream-100 text-left">
                <tr>
                  <th className="overline muted no-dash text-[10px] px-4 py-3">
                    Kỳ
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3">
                    Chủ nhà
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3">
                    Gói cước
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3 text-right">
                    Phòng
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3 text-right">
                    Số tiền
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3">
                    Hết hạn
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3">
                    Trạng thái
                  </th>
                  <th className="overline muted no-dash text-[10px] px-4 py-3 text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-200">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3 text-ink-700 text-xs font-mono">
                      {s.startAt.slice(0, 7)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/users/${s.ownerId}`}
                        className="font-medium text-ink-900 hover:underline"
                      >
                        {s.ownerName}
                      </Link>
                      <p className="text-[11px] font-mono text-ink-500">
                        {s.ownerId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.plan === 'pro' ? 'gold' : 'info'}>
                        {PLAN_LABEL[s.plan]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-ink-700">
                      {s.roomCount}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">
                      {formatVND(s.amount)}
                    </td>
                    <td className="px-4 py-3 text-ink-700 text-xs">
                      <FormattedDate iso={s.expireAt} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STATUS_VARIANT[s.status]}>
                        {STATUS_LABEL[s.status]}
                      </Badge>
                      {s.note && (
                        <p
                          className="mt-1 text-[10px] text-ink-500 max-w-[180px] truncate"
                          title={s.note}
                        >
                          {s.note}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
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
        )}
      </section>

      <p className="mt-6 text-xs text-ink-500">
        Bảng giá theo phòng: Miễn phí (1-3 phòng: 0 ₫) · Cơ bản (4-10:
        50.000 ₫/phòng) · Tiêu chuẩn (11-30: 40.000 ₫/phòng) · Chuyên nghiệp
        (31+: 30.000 ₫/phòng).
      </p>
    </div>
  );
}
