import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Copy,
  Inbox,
  Search,
  TrendingUp,
  Wallet,
} from 'lucide-react';

import { listPaymentSessionsAction } from '@/app/actions/payment-sessions';
import { MarkSessionPaidButton } from '@/components/admin/mark-session-paid-button';
import { PageHeader, StatCard } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { FormattedDate } from '@/components/common/formatted-date';
import {
  PAYMENT_SESSION_STATUS_LABEL,
  type PaymentSession,
  type PaymentSessionStatus,
} from '@/core/entities/payment-session';
import { displayName, formatVND } from '@/lib/format';

export const metadata: Metadata = { title: 'Duyệt gói cước đã mua' };

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

const TABS: { key: string; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'Chờ thanh toán', icon: Clock },
  { key: 'paid', label: 'Đã thanh toán', icon: CheckCircle2 },
  { key: 'expired', label: 'Hết hạn', icon: Inbox },
  { key: 'all', label: 'Tất cả', icon: Wallet },
];

function parseStatus(v: string | undefined): PaymentSessionStatus | undefined {
  const allowed: PaymentSessionStatus[] = [
    'pending',
    'paid',
    'expired',
    'failed',
    'refunded',
  ];
  return allowed.includes(v as PaymentSessionStatus)
    ? (v as PaymentSessionStatus)
    : undefined;
}

function buildHref(base: string, params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) sp.set(k, v);
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}

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

export default async function PaymentSessionsPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await props.searchParams;
  // Default: pending. Khi user click "Tất cả" → URL có `?status=all` → undefined → BE trả tất cả.
  const activeKey = sp.status ?? 'pending';
  const status =
    activeKey === 'all' ? undefined : parseStatus(activeKey) ?? 'pending';
  const res = await listPaymentSessionsAction({
    status,
    search: sp.q?.trim() || undefined,
    limit: 100,
  });
  const sessions: PaymentSession[] = res.ok ? res.data : [];

  const pendingTotal = sessions
    .filter((s) => s.status === 'pending')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const paidTotal = sessions
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const pendingCount = sessions.filter((s) => s.status === 'pending').length;
  const paidCount = sessions.filter((s) => s.status === 'paid').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Tài chính"
        title="Duyệt gói cước chủ nhà mua"
        description="Khi chủ nhà chuyển khoản phí gói cước, mở app banking ACB tìm giao dịch khớp nội dung CK rồi xác nhận đã nhận tiền để kích hoạt subscription."
        breadcrumbs={[
          { label: 'Subscription', href: '/admin/payments' },
          { label: 'Duyệt gói cước đã mua' },
        ]}
      />

      {!res.ok && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Không tải được danh sách: {res.error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chờ duyệt"
          value={String(pendingCount)}
          hint={pendingTotal > 0 ? `${formatVND(pendingTotal)} chờ thu` : undefined}
        />
        <StatCard
          label="Đã duyệt"
          value={String(paidCount)}
          hint={paidTotal > 0 ? `${formatVND(paidTotal)} đã thu` : undefined}
        />
        <StatCard label="Tổng session" value={String(sessions.length)} />
        <StatCard
          label="TK nhận tiền"
          value="ACB 21169431"
          hint="NGUYEN VU NAM"
        />
      </div>

      {/* Bank account banner */}
      <div className="mb-6 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-amber-50 to-orange-50 p-5 ring-1 ring-amber-200/80">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm">
            <Banknote className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
              Tài khoản nhận chuyển khoản
            </p>
            <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-2xl font-bold tracking-tight text-amber-950">
                21169431
              </span>
              <span className="text-sm font-medium text-amber-900">
                Á Châu (ACB)
              </span>
              <span className="text-sm text-amber-800">·</span>
              <span className="text-sm font-medium text-amber-900">
                NGUYEN VU NAM
              </span>
            </div>
            <p className="mt-2 text-xs text-amber-800">
              Nội dung CK của user theo định dạng:{' '}
              <code className="rounded bg-white/60 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-900 ring-1 ring-amber-200">
                HALONG24H &lt;sessionId&gt;
              </code>{' '}
              · Click "Đã nhận tiền" sau khi đối soát app banking.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const active = activeKey === t.key;
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={buildHref('/admin/payments/sessions', {
                  status: t.key === 'pending' ? undefined : t.key,
                  q: sp.q,
                })}
                className={
                  'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all ' +
                  (active
                    ? 'bg-navy-900 text-white shadow-sm'
                    : 'text-ink-600 hover:bg-cream-200 hover:text-ink-900')
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </Link>
            );
          })}
        </div>

        <form
          action="/admin/payments/sessions"
          method="get"
          className="relative max-w-xs w-full sm:w-auto"
        >
          {sp.status && <input type="hidden" name="status" value={sp.status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={sp.q}
            placeholder="Tìm sessionId, mã CK, tên user..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Wallet className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Không có session nào ở trạng thái này
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Khi chủ nhà tạo payment session, sẽ xuất hiện ở đây để admin đối soát.
          </p>
        </div>
      ) : (
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
                return (
                  <tr
                    key={s.id}
                    className="transition-colors hover:bg-cream-50/60"
                  >
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
                      <div className="flex flex-col gap-0.5">
                        <span className="inline-flex w-fit items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200">
                          {s.planId}
                        </span>
                        <span className="text-[11px] text-ink-500">
                          {s.rooms} phòng · {s.cycle === 'monthly' ? 'tháng' : 'năm'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-1.5 rounded-md bg-cream-100 px-2 py-1 font-mono text-[11px] text-ink-700 ring-1 ring-ink-200/60">
                        <Copy className="h-3 w-3 text-ink-400" />
                        {s.ckContent}
                      </div>
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
                      <Badge variant={STATUS_VARIANT[s.status]}>
                        {PAYMENT_SESSION_STATUS_LABEL[s.status]}
                      </Badge>
                      {s.paidAt && (
                        <p className="mt-1 text-[10px] text-emerald-600">
                          <FormattedDate iso={s.paidAt} />
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.status === 'pending' ? (
                        <MarkSessionPaidButton
                          sessionId={s.id}
                          ckContent={s.ckContent}
                          amount={s.totalAmount}
                        />
                      ) : s.status === 'expired' ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2 py-1 text-[11px] font-medium text-ink-500 ring-1 ring-ink-200"
                          title="Session đã hết hạn 24h, không thể xác nhận"
                        >
                          Đã hết hạn
                        </span>
                      ) : s.reference ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 font-mono text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-200"
                          title="Mã giao dịch banking"
                        >
                          <TrendingUp className="h-3 w-3" />
                          {s.reference}
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
      )}
    </div>
  );
}
