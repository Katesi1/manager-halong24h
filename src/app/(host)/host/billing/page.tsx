import type { Metadata } from 'next';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { listPropertiesAction } from '@/app/actions/properties';
import { PageHeader } from '@/components/host/page-header';
import { TierSelector } from '@/components/host/tier-selector';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate } from '@/lib/format';
import {
  PLAN_LABEL,
  PRICE_PER_ROOM,
  planForRoomCount,
  type SubscriptionPlan,
} from '@/core/entities/subscription';

export const metadata: Metadata = { title: 'Gói cước' };

const ROOM_RANGE: Record<SubscriptionPlan, string> = {
  free: '1–3 phòng',
  basic: '4–10 phòng',
  standard: '11–30 phòng',
  pro: '31+ phòng',
};

interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  paidAt: string | null;
  roomsCount: number;
}

export default async function HostBillingPage() {
  const [profile, propertiesResult, subResult] = await Promise.all([
    getCurrentProfile(),
    listPropertiesAction({ includeInactive: true }),
    getMySubscriptionAction(),
  ]);

  if (!profile) return null;

  const roomCount = propertiesResult.ok ? propertiesResult.data.length : 0;
  const sub = subResult.ok ? subResult.data : null;

  const currentPlan: SubscriptionPlan = sub?.plan ?? planForRoomCount(roomCount);
  const monthlyFee = roomCount * PRICE_PER_ROOM[currentPlan];

  const invoices: Invoice[] = [
    { id: 'inv-1', period: '04/2026', amount: 350_000, status: 'paid', paidAt: '2026-04-05', roomsCount: roomCount },
    { id: 'inv-2', period: '03/2026', amount: 350_000, status: 'paid', paidAt: '2026-03-05', roomsCount: roomCount },
    { id: 'inv-3', period: '02/2026', amount: 250_000, status: 'paid', paidAt: '2026-02-08', roomsCount: Math.max(0, roomCount - 2) },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Gói cước"
        description="Chọn gói phù hợp với quy mô cơ sở của bạn."
      />

      {/* ── Current plan hero ── */}
      <section className="rounded-2xl overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-gold-400">
                Gói hiện tại
              </p>
              <h2 className="mt-2 font-display text-4xl font-bold text-white">
                {PLAN_LABEL[currentPlan]}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {roomCount} phòng hoạt động · {ROOM_RANGE[currentPlan]}
              </p>
              {sub && (
                <p className="mt-1 text-xs text-white/50">
                  Hết hạn: {formatDate(sub.expireAt)}
                  {sub.status === 'past_due' && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-300">
                      Quá hạn
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-white/50">
                Chi phí tháng này
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-white">
                {monthlyFee === 0 ? 'Miễn phí' : formatVND(monthlyFee)}
              </p>
              {monthlyFee > 0 && (
                <p className="mt-1 text-xs text-white/60">
                  {formatVND(PRICE_PER_ROOM[currentPlan])} / phòng / tháng
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-ink-200 bg-white">
          <QuickStat label="Số phòng" value={String(roomCount)} />
          <QuickStat
            label="Đơn giá"
            value={
              PRICE_PER_ROOM[currentPlan] > 0
                ? formatVND(PRICE_PER_ROOM[currentPlan])
                : '0 ₫'
            }
          />
          <QuickStat
            label="Trạng thái"
            value={
              sub?.status === 'past_due'
                ? 'Quá hạn'
                : sub?.status === 'frozen'
                  ? 'Tạm khoá'
                  : monthlyFee === 0
                    ? 'Miễn phí'
                    : 'Hoạt động'
            }
            valueClass={
              sub?.status === 'past_due'
                ? 'text-rose-600'
                : sub?.status === 'frozen'
                  ? 'text-amber-600'
                  : 'text-emerald-700'
            }
          />
        </div>
      </section>

      {/* ── Tier selector ── */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Chọn gói cước
        </h2>
        <p className="mt-1 text-xs text-ink-500 mb-5">
          Click vào gói bạn muốn chuyển. Hệ thống sẽ hướng dẫn các bước tiếp theo.
        </p>
        <TierSelector currentPlan={currentPlan} roomCount={roomCount} />
      </section>

      {/* ── How it works ── */}
      <section className="mt-8 rounded-2xl bg-cream-100 p-6 ring-1 ring-ink-200/60">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-gold-100 p-2 text-gold-700 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-navy-900">
              Quy trình đăng ký / nâng cấp
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-ink-700">
              <li className="flex items-start gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy-900 text-[10px] font-bold text-white mt-0.5">1</span>
                Chọn gói cước phù hợp với số phòng của bạn
              </li>
              <li className="flex items-start gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy-900 text-[10px] font-bold text-white mt-0.5">2</span>
                Xác nhận và chuyển khoản theo thông tin Halong24h cung cấp
              </li>
              <li className="flex items-start gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy-900 text-[10px] font-bold text-white mt-0.5">3</span>
                Admin xác nhận thanh toán, gói mới có hiệu lực ngay lập tức
              </li>
            </ol>
            <p className="mt-3 text-xs text-ink-500">
              Quá hạn 7 ngày → cảnh báo. Quá 14 ngày → tạm khóa cơ sở cho tới khi thanh toán.
            </p>
          </div>
        </div>
      </section>

      {/* ── Invoice history ── */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Lịch sử hoá đơn
        </h2>
        {invoices.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
            Chưa có hoá đơn nào
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="border-b border-ink-200 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="px-5 py-3">Kỳ thanh toán</th>
                  <th className="px-5 py-3">Phòng</th>
                  <th className="px-5 py-3">Số tiền</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3">Ngày TT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-cream-50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-medium text-ink-900">
                      {inv.period}
                    </td>
                    <td className="px-5 py-3.5 text-ink-700">
                      {inv.roomsCount} phòng
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">
                      {formatVND(inv.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <InvoiceStatus status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-500">
                      {inv.paidAt ? formatDate(inv.paidAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function QuickStat({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="px-5 py-3.5 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500">
        {label}
      </p>
      <p className={`mt-0.5 font-display text-lg font-semibold ${valueClass ?? 'text-navy-900'}`}>
        {value}
      </p>
    </div>
  );
}

function InvoiceStatus({ status }: { status: 'paid' | 'pending' | 'overdue' }) {
  const config = {
    paid: { label: 'Đã thanh toán', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    pending: { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700 ring-amber-200' },
    overdue: { label: 'Quá hạn', cls: 'bg-rose-50 text-rose-700 ring-rose-200' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ${c.cls}`}>
      {c.label}
    </span>
  );
}
