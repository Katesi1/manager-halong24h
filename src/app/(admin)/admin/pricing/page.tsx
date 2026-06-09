import type { Metadata } from 'next';
import { AlertCircle, Check, Sparkles } from 'lucide-react';

import {
  listAllBillingPlansAction,
  listBillingPlansAction,
} from '@/app/actions/billing-plans';
import {
  AdminWriteHint,
  BillingPlanEditor,
} from '@/components/admin/billing-plan-editor';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import {
  POPULAR_PLAN_ID,
  pricePerRoom,
  planLabel,
  planTagline,
  yearlySavingsPercent,
  type BillingPlan,
} from '@/core/entities/billing-plan';
import { formatVND } from '@/core/value-objects/vnd';

export const metadata: Metadata = { title: 'Quản lý gói cước' };

export default async function AdminPricingPage() {
  const [publicResult, adminResult] = await Promise.all([
    listBillingPlansAction(),
    listAllBillingPlansAction(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Cấu hình"
        title="Quản lý gói cước"
        description="CRUD trực tiếp qua /admin/billing-plans. Bảng public preview dưới đây là dữ liệu user thật sự thấy (cache 5 phút)."
      />

      {adminResult.ok ? (
        <>
          <BillingPlanEditor initialPlans={adminResult.data} />
          <AdminWriteHint />
        </>
      ) : (
        <ErrorBanner message={adminResult.error} />
      )}

      <div className="mt-10 border-t border-ink-200 pt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Public preview (user thấy)
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Dữ liệu từ <code className="rounded bg-cream-100 px-1.5">/billing/plans</code>{' '}
          — chỉ gói <strong>active</strong>, cache 5 phút.
        </p>

        {!publicResult.ok ? (
          <ErrorBanner message={publicResult.error} />
        ) : (
          <>
            <PlansTable plans={publicResult.data} />
            <PlansGrid plans={publicResult.data} />
          </>
        )}
      </div>

      <Notes />
    </div>
  );
}

function PlansTable({ plans }: { plans: BillingPlan[] }) {
  return (
    <section className="mt-6 overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="border-b border-ink-200 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">
          <tr>
            <th className="px-5 py-3">ID</th>
            <th className="px-5 py-3">Tên gói</th>
            <th className="px-5 py-3">Phòng tối đa</th>
            <th className="px-5 py-3">Giá tháng</th>
            <th className="px-5 py-3">Giá năm</th>
            <th className="px-5 py-3">Giảm năm</th>
            <th className="px-5 py-3">Giá / phòng / tháng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {plans.map((plan) => {
            const isContact =
              plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
            const perRoom = pricePerRoom(plan);
            const savings = yearlySavingsPercent(plan);
            return (
              <tr key={plan.id} className="hover:bg-cream-50 transition-colors">
                <td className="px-5 py-3.5 font-mono text-xs text-ink-500">
                  {plan.id}
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-navy-900">
                      {planLabel(plan.id)}
                    </span>
                    {plan.id === POPULAR_PLAN_ID && (
                      <Badge variant="gold">Phổ biến</Badge>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-ink-700">
                  {plan.rooms === -1 ? '∞' : `${plan.rooms} phòng`}
                </td>
                <td className="px-5 py-3.5 font-semibold text-navy-900">
                  {isContact ? 'Liên hệ' : formatVND(plan.monthlyPrice)}
                </td>
                <td className="px-5 py-3.5 text-ink-700">
                  {isContact ? 'Liên hệ' : formatVND(plan.yearlyPrice)}
                </td>
                <td className="px-5 py-3.5">
                  {savings > 0 ? (
                    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
                      −{savings}%
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
                <td className="px-5 py-3.5 text-xs text-ink-600">
                  {perRoom > 0 ? `${formatVND(perRoom)} / phòng` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function PlansGrid({ plans }: { plans: BillingPlan[] }) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
        Xem nhanh từng gói
      </h2>
      <p className="mt-1 text-xs text-ink-500">
        Card preview giống như chủ nhà sẽ thấy trên trang billing.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: BillingPlan }) {
  const isContact = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
  const isPopular = plan.id === POPULAR_PLAN_ID;
  const savings = yearlySavingsPercent(plan);

  return (
    <div
      className={
        'relative flex flex-col rounded-2xl bg-white p-5 ring-1 shadow-card ' +
        (isPopular
          ? 'ring-2 ring-gold-400 shadow-md'
          : 'ring-ink-200/60')
      }
    >
      {isPopular && (
        <Badge
          variant="gold"
          className="absolute -top-2.5 left-1/2 -translate-x-1/2"
        >
          <Sparkles className="mr-1 inline h-3 w-3" />
          Phổ biến nhất
        </Badge>
      )}

      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-400">
        {plan.id}
      </p>
      <h3 className="mt-1 font-display text-xl font-bold text-navy-900">
        {planLabel(plan.id)}
      </h3>
      <p className="text-[11px] text-ink-500 mt-0.5 min-h-[2.4em]">
        {planTagline(plan.id)}
      </p>

      <div className="mt-4">
        <p className="font-display text-2xl font-bold text-navy-900">
          {isContact ? 'Liên hệ' : formatVND(plan.monthlyPrice)}
        </p>
        <p className="text-[11px] text-ink-500">
          {isContact ? 'Báo giá theo hợp đồng' : '/ tháng (chưa VAT)'}
        </p>
        {!isContact && plan.yearlyPrice > 0 && (
          <p className="mt-1 text-xs text-emerald-700 font-medium">
            Năm: {formatVND(plan.yearlyPrice)}
            {savings > 0 && <span className="ml-1">(−{savings}%)</span>}
          </p>
        )}
      </div>

      <p className="mt-3 text-xs text-ink-600">
        Phòng:{' '}
        <strong className="text-ink-900">
          {plan.rooms === -1 ? 'Không giới hạn' : `${plan.rooms} phòng`}
        </strong>
      </p>

      <ul className="mt-4 flex-1 space-y-1.5 text-xs text-ink-700">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5">
            <Check className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-600" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
      <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
      <div>
        <p className="font-semibold text-rose-900">Không tải được gói cước</p>
        <p className="mt-1 text-xs text-rose-700">{message}</p>
      </div>
    </div>
  );
}

function Notes() {
  return (
    <div className="mt-6 rounded-xl bg-cream-100 px-5 py-4 text-sm text-ink-600">
      <p className="font-semibold text-ink-800">Ghi chú:</p>
      <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
        <li>
          Giá hiển thị <strong>chưa bao gồm VAT 10%</strong> (Enterprise tính
          riêng theo hợp đồng).
        </li>
        <li>
          Chu kỳ năm được giảm so với 12 tháng — Business giảm sâu nhất 37%.
        </li>
        <li>
          Catalog quản lý ở BE qua{' '}
          <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-ink-200">
            GET /billing/plans
          </code>{' '}
          — kết quả cache 5 phút.
        </li>
        <li>
          ID gói (<code>rooms_1</code>, <code>rooms_5</code>, ...) là khoá kỹ
          thuật ánh xạ tới{' '}
          <code className="rounded bg-white px-1.5 py-0.5 ring-1 ring-ink-200">
            User.subscriptionPlanId
          </code>
          .
        </li>
      </ul>
    </div>
  );
}

