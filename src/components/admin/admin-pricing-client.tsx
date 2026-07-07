'use client';

import { AlertCircle, Check, Sparkles } from 'lucide-react';

import {
  AdminWriteHint,
  BillingPlanEditor,
} from '@/components/admin/billing-plan-editor';
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
import { useApiResource } from '@/lib/use-api-resource';

interface PricingData {
  publicPlans: BillingPlan[];
  publicError: string | null;
  adminPlans: BillingPlan[];
  adminError: string | null;
}

/**
 * Quản lý gói cước fetch từ `/api/admin/pricing` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Editor (admin catalog) + preview (public catalog).
 */
export function AdminPricingClient() {
  const { loading, error, data } = useApiResource<PricingData>(
    '/api/admin/pricing',
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return <ErrorBanner message={error ?? 'Không tải được gói cước'} />;
  }

  return (
    <>
      {data.adminError ? (
        <ErrorBanner message={data.adminError} />
      ) : (
        <>
          <BillingPlanEditor initialPlans={data.adminPlans} />
          <AdminWriteHint />
        </>
      )}

      <div className="mt-10 border-t border-ink-200 pt-8">
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Xem trước danh mục công khai
        </h2>
        <p className="mt-1 text-xs text-ink-500">
          Chỉ hiển thị các gói <strong>đang bật</strong>. Cột nào chưa được cấu
          hình sẽ hiển thị <strong>—</strong>.
        </p>

        {data.publicError ? (
          <ErrorBanner message={data.publicError} />
        ) : (
          <>
            <PlansTable plans={data.publicPlans} />
            <PlansGrid plans={data.publicPlans} />
          </>
        )}
      </div>

      <Notes />
    </>
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
            const isContact = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
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
                  {plan.rooms == null
                    ? '—'
                    : plan.rooms === -1
                      ? '∞'
                      : `${plan.rooms} phòng`}
                </td>
                <td className="px-5 py-3.5 font-semibold text-navy-900">
                  {isContact
                    ? 'Liên hệ'
                    : plan.monthlyPrice
                      ? formatVND(plan.monthlyPrice)
                      : '—'}
                </td>
                <td className="px-5 py-3.5 text-ink-700">
                  {isContact
                    ? 'Liên hệ'
                    : plan.yearlyPrice
                      ? formatVND(plan.yearlyPrice)
                      : '—'}
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
        Dạng thẻ của từng gói trong danh mục công khai.
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
        (isPopular ? 'ring-2 ring-gold-400 shadow-md' : 'ring-ink-200/60')
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
          {plan.rooms == null
            ? '—'
            : plan.rooms === -1
              ? 'Không giới hạn'
              : `${plan.rooms} phòng`}
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
          Giá hiển thị <strong>chưa bao gồm VAT 10%</strong> (gói Enterprise tính
          riêng theo hợp đồng).
        </li>
        <li>Thanh toán theo năm được giảm giá so với trả từng tháng.</li>
        <li>
          Thay đổi gói áp dụng ngay cho chủ nhà đăng ký mới; chủ nhà đang dùng
          chỉ đổi giá từ kỳ gia hạn kế tiếp.
        </li>
      </ul>
    </div>
  );
}
