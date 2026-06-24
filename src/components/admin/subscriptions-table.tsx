import Link from 'next/link';

import { SubscriptionRowActions } from '@/components/admin/subscription-row-actions';
import { FormattedDate } from '@/components/common/formatted-date';
import { Badge } from '@/components/ui/badge';
import {
  type Subscription,
  type SubscriptionStatus,
} from '@/core/entities/subscription';
import { planLabel } from '@/core/entities/billing-plan';
import { displayName, formatVND } from '@/lib/format';

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  none: 'Chưa có',
  trial: 'Trial',
  active: 'Đang hoạt động',
  past_due: 'Quá hạn',
  cancelled: 'Đã huỷ',
  frozen: 'Đã khoá',
  expired: 'Hết hạn',
};

export const SUBSCRIPTION_STATUS_VARIANT: Record<
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

/** Màu avatar ổn định theo seed (chia sẻ giữa các bảng admin). */
export function avatarColor(seed: string): string {
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

interface Props {
  subscriptions: Subscription[];
}

/** Bảng trạng thái gói cước của từng chủ nhà (view "Tất cả gói cước"). */
export function SubscriptionsTable({ subscriptions }: Props) {
  return (
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
          {subscriptions.map((s) => {
            const name = displayName(s.ownerName, s.ownerEmail);
            const initial = name.charAt(0).toUpperCase() || '?';
            const color = avatarColor(s.ownerId || name);
            return (
              <tr key={s.id} className="transition-colors hover:bg-cream-50">
                <td className="px-5 py-4">
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
                  <Badge variant={SUBSCRIPTION_STATUS_VARIANT[s.status]}>
                    {SUBSCRIPTION_STATUS_LABEL[s.status]}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
