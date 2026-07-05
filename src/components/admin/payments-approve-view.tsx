import Link from 'next/link';
import { CheckCircle2, Clock, Inbox, Search, Wallet } from 'lucide-react';

import { PaymentSessionsTable } from '@/components/admin/payment-sessions-table';
import { ReceivingBankPanel } from '@/components/admin/receiving-bank-panel';
import {
  PAYMENTS_PAGE_SIZE,
  buildPaymentsHref,
} from '@/components/admin/payments-shared';
import { StatCard } from '@/components/host/page-header';
import { Pagination } from '@/components/ui/pagination';
import {
  isPaymentSessionActionable,
  type PaymentSession,
  type PaymentSessionStatus,
} from '@/core/entities/payment-session';
import type { ReceivingBankAccount } from '@/core/entities/platform-bank';
import { formatVND } from '@/lib/format';

const SESSION_TABS: { key: string; label: string; icon: typeof Clock }[] = [
  { key: 'pending', label: 'Chờ thanh toán', icon: Clock },
  { key: 'paid', label: 'Đã thanh toán', icon: CheckCircle2 },
  { key: 'expired', label: 'Hết hạn', icon: Inbox },
  { key: 'all', label: 'Tất cả', icon: Wallet },
];

function parseSessionStatus(
  v: string | undefined,
): PaymentSessionStatus | undefined {
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

interface Props {
  sessions: PaymentSession[];
  actionableCount: number;
  actionableTotal: number;
  now: number;
  status?: string;
  q?: string;
  currentPage: number;
  pageHref: (page: number) => string;
  error?: string;
  receivingBank: ReceivingBankAccount;
  receivingBankError?: string;
}

/** View "Chờ duyệt thanh toán" — hàng đợi đối soát chuyển khoản + kích hoạt gói. */
export function PaymentsApproveView({
  sessions,
  actionableCount,
  actionableTotal,
  now,
  status,
  q,
  currentPage,
  pageHref,
  error,
  receivingBank,
  receivingBankError,
}: Props) {
  const activeKey = status ?? 'pending';
  const wantStatus =
    activeKey === 'all' ? undefined : parseSessionStatus(activeKey) ?? 'pending';

  const paidTotal = sessions
    .filter((s) => s.status === 'paid')
    .reduce((sum, s) => sum + s.totalAmount, 0);
  const paidCount = sessions.filter((s) => s.status === 'paid').length;

  // Tab "pending" chỉ hiện session còn xác nhận được (chưa quá TTL 24h).
  const filtered =
    activeKey === 'pending'
      ? sessions.filter((s) => isPaymentSessionActionable(s, now))
      : wantStatus
        ? sessions.filter((s) => s.status === wantStatus)
        : sessions;

  const totalPages = Math.ceil(filtered.length / PAYMENTS_PAGE_SIZE);
  const pageSessions = filtered.slice(
    (currentPage - 1) * PAYMENTS_PAGE_SIZE,
    currentPage * PAYMENTS_PAGE_SIZE,
  );

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Không tải được danh sách: {error}
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Chờ duyệt"
          value={String(actionableCount)}
          hint={
            actionableTotal > 0
              ? `${formatVND(actionableTotal)} chờ thu`
              : undefined
          }
        />
        <StatCard
          label="Đã duyệt"
          value={String(paidCount)}
          hint={paidTotal > 0 ? `${formatVND(paidTotal)} đã thu` : undefined}
        />
        <StatCard label="Tổng session" value={String(sessions.length)} />
        <StatCard
          label="TK nhận tiền mua gói"
          value={receivingBank.bankAccountNumber ?? '—'}
          hint={receivingBank.bankAccountName ?? receivingBank.bankName ?? undefined}
        />
      </div>

      {/* Bank account panel — STK nền tảng nhận tiền mua gói (§10.7), ADMIN sửa được */}
      <ReceivingBankPanel bank={receivingBank} error={receivingBankError} />

      {/* Tabs + Search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {SESSION_TABS.map((t) => {
            const active = activeKey === t.key;
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                href={buildPaymentsHref({
                  view: 'approve',
                  status: t.key === 'pending' ? undefined : t.key,
                  q,
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
          action="/admin/payments"
          method="get"
          className="relative max-w-xs w-full sm:w-auto"
        >
          <input type="hidden" name="view" value="approve" />
          {status && <input type="hidden" name="status" value={status} />}
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm sessionId, mã CK, tên user..."
            className="h-10 w-full rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20"
          />
        </form>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <Wallet className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Không có session nào ở trạng thái này
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Khi chủ nhà tạo payment session, sẽ xuất hiện ở đây để admin đối
            soát.
          </p>
        </div>
      ) : (
        <>
          <PaymentSessionsTable sessions={pageSessions} now={now} />
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
