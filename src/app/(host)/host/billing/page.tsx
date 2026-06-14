import type { Metadata } from 'next';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { listBillingPlansAction } from '@/app/actions/billing-plans';
import { listPropertiesAction } from '@/app/actions/properties';
import { PageHeader } from '@/components/host/page-header';
import { TierSelector } from '@/components/host/tier-selector';
import { planLabel, type BillingPlan } from '@/core/entities/billing-plan';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Gói cước' };

export default async function HostBillingPage() {
  const [profile, propertiesResult, subResult, plansResult] = await Promise.all([
    getCurrentProfile(),
    listPropertiesAction({ includeInactive: true }),
    getMySubscriptionAction(),
    listBillingPlansAction(),
  ]);

  if (!profile) return null;

  const roomCount = propertiesResult.ok ? propertiesResult.data.length : 0;
  const sub = subResult.ok ? subResult.data : null;
  const plans: BillingPlan[] = plansResult.ok ? plansResult.data : [];
  const plansError = !plansResult.ok ? plansResult.error : null;

  const currentPlanId = sub?.planId || null;
  // Tên gói lấy từ danh mục admin (theo planId). Không có sub → gói Miễn phí.
  const currentLabel = currentPlanId ? planLabel(currentPlanId) : 'Miễn phí';
  // Chi phí kỳ này: số tiền thật BE trả. Không có sub / 0 → Miễn phí.
  const periodCost =
    sub && sub.amount > 0 ? formatVND(sub.amount) : 'Miễn phí';

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
                {currentLabel}
              </h2>
              <p className="mt-2 text-sm text-white/70">
                {roomCount} phòng đang hoạt động
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
                Chi phí kỳ này
              </p>
              <p className="mt-1 font-display text-4xl font-bold text-white">
                {periodCost}
              </p>
              {sub && (
                <p className="mt-1 text-xs text-white/60">
                  {sub.cycle === 'yearly' ? 'Thanh toán theo năm' : 'Thanh toán theo tháng'}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-ink-200 bg-white">
          <QuickStat label="Số phòng" value={String(roomCount)} />
          <QuickStat
            label="Kỳ thanh toán"
            value={
              sub ? (sub.cycle === 'yearly' ? 'Theo năm' : 'Theo tháng') : '—'
            }
          />
          <QuickStat
            label="Trạng thái"
            value={
              sub?.status === 'past_due'
                ? 'Quá hạn'
                : sub?.status === 'frozen'
                  ? 'Tạm khoá'
                  : sub && sub.amount > 0
                    ? 'Hoạt động'
                    : 'Miễn phí'
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

      {/* ── Plan catalog ── */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Chọn gói cước
        </h2>
        <p className="mt-1 mb-5 text-xs text-ink-500">
          Click vào gói bạn muốn đăng ký. Hệ thống sẽ hướng dẫn các bước tiếp theo.
        </p>

        {plansError ? (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            Không tải được danh sách gói: {plansError}
          </div>
        ) : plans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
            Chưa có gói cước nào.
          </div>
        ) : (
          <TierSelector plans={plans} currentPlanId={currentPlanId} />
        )}
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
        <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-sm text-ink-500">
          Chưa có hoá đơn nào. Lịch sử thanh toán gói cước sẽ hiển thị tại đây khi
          backend cung cấp dữ liệu.
        </div>
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
