import { CheckCircle2 } from 'lucide-react';

import { CopyableCode } from '@/components/admin/copyable-code';
import { MarkSessionPaidButton } from '@/components/admin/mark-session-paid-button';
import { avatarColor } from '@/components/admin/subscriptions-table';
import { FormattedDate } from '@/components/common/formatted-date';
import { Badge } from '@/components/ui/badge';
import {
  PAYMENT_SESSION_STATUS_LABEL,
  isPaymentSessionActionable,
  isPaymentSessionExpired,
  type PaymentSession,
  type PaymentSessionStatus,
} from '@/core/entities/payment-session';
import { displayName, formatVND } from '@/lib/format';

const STATUS_VARIANT: Record<
  PaymentSessionStatus,
  Parameters<typeof Badge>[0]['variant']
> = {
  pending: 'warning',
  paid: 'success',
  expired: 'default',
  failed: 'danger',
  refunded: 'info',
};

interface Props {
  sessions: PaymentSession[];
  /** Mốc thời gian render — dùng chung cho mọi tính toán hết-hạn. */
  now: number;
}

/** Bảng payment session chờ đối soát (view "Chờ duyệt thanh toán"). */
export function PaymentSessionsTable({ sessions, now }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-ink-200 bg-cream-50">
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              Chủ nhà
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              Gói cước
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              Nội dung CK
            </th>
            <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-ink-500">
              Số tiền
            </th>
            <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-ink-500">
              Hết hạn
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
          {sessions.map((s) => {
            const name = displayName(s.userName, s.userEmail);
            const initial = name.charAt(0).toUpperCase() || '?';
            const color = avatarColor(s.userId || s.userEmail || s.id);
            const expired = isPaymentSessionExpired(s, now);
            return (
              <tr key={s.id} className="transition-colors hover:bg-cream-50/60">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}
                    >
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 truncate">
                        {name}
                      </p>
                      <p className="text-xs text-ink-500 truncate">
                        {s.userEmail || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <p className="font-medium text-ink-900">{s.planLabel}</p>
                  <p className="text-[11px] text-ink-500">
                    {s.cycle === 'yearly' ? 'Theo năm' : 'Theo tháng'}
                  </p>
                </td>
                <td className="px-5 py-4">
                  <CopyableCode value={s.ckContent} />
                </td>
                <td className="px-5 py-4 text-right">
                  <span className="font-mono text-base font-bold tabular-nums text-emerald-700">
                    {formatVND(s.totalAmount)}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-ink-500">
                  <FormattedDate iso={s.expiresAt} />
                </td>
                <td className="px-5 py-4">
                  <Badge
                    variant={expired ? 'default' : STATUS_VARIANT[s.status]}
                  >
                    {expired
                      ? PAYMENT_SESSION_STATUS_LABEL.expired
                      : PAYMENT_SESSION_STATUS_LABEL[s.status]}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-right">
                  {isPaymentSessionActionable(s, now) ? (
                    <MarkSessionPaidButton
                      sessionId={s.id}
                      ckContent={s.ckContent}
                      amount={s.totalAmount}
                    />
                  ) : expired ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-500 ring-1 ring-ink-200"
                      title="Session đã hết hạn 24h, không thể xác nhận"
                    >
                      Đã hết hạn
                    </span>
                  ) : s.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Đã nhận tiền
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
