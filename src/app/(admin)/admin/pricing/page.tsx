import type { Metadata } from 'next';

import { TierPricingEditor } from '@/components/admin/tier-pricing-editor';
import { PageHeader } from '@/components/host/page-header';
import {
  PLAN_LABEL,
  PRICE_PER_ROOM,
  type SubscriptionPlan,
} from '@/core/entities/subscription';

export const metadata: Metadata = { title: 'Quản lý gói cước' };

const PLANS: SubscriptionPlan[] = ['free', 'basic', 'standard', 'pro'];

const PLAN_ROOMS: Record<SubscriptionPlan, string> = {
  free: '1–3 phòng',
  basic: '4–10 phòng',
  standard: '11–30 phòng',
  pro: '31+ phòng',
};

const PLAN_COLOR: Record<SubscriptionPlan, string> = {
  free: 'bg-cream-100 ring-ink-200/60',
  basic: 'bg-navy-50 ring-navy-200/60',
  standard: 'bg-navy-100 ring-navy-300/60',
  pro: 'bg-gold-50 ring-gold-200/60',
};

const PLAN_ACCENT: Record<SubscriptionPlan, string> = {
  free: 'text-ink-600',
  basic: 'text-navy-700',
  standard: 'text-navy-800',
  pro: 'text-gold-800',
};

export default function AdminPricingPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Cấu hình"
        title="Quản lý gói cước"
        description="Cấu hình giá gói subscription cho chủ nhà. Giá tính theo số phòng/tháng, thanh toán theo chu kỳ tháng hoặc năm (giảm 20%)."
      />

      {/* Current tiers overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const price = PRICE_PER_ROOM[plan];
          return (
            <div
              key={plan}
              className={`rounded-2xl p-5 ring-1 shadow-card ${PLAN_COLOR[plan]}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wider ${PLAN_ACCENT[plan]}`}>
                {PLAN_LABEL[plan]}
              </p>
              <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-navy-900">
                {price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')}₫`}
              </p>
              <p className="mt-1 text-sm text-ink-500">
                {price === 0 ? 'Không tính phí' : '/phòng/tháng'}
              </p>
              <p className="mt-3 text-xs text-ink-600">
                {PLAN_ROOMS[plan]}
              </p>
              {price > 0 && (
                <p className="mt-1 text-xs text-ink-400">
                  Năm: {Math.round(price * 12 * 0.8).toLocaleString('vi-VN')}₫/phòng/năm (−20%)
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Editable tier table */}
      <TierPricingEditor />

      <div className="mt-6 rounded-xl bg-cream-100 px-5 py-4 text-sm text-ink-600">
        <p className="font-semibold text-ink-800">Lưu ý khi thay đổi giá:</p>
        <ul className="mt-2 list-disc list-inside space-y-1 text-xs">
          <li>Thay đổi giá chỉ áp dụng cho kỳ subscription mới, không ảnh hưởng kỳ đang chạy.</li>
          <li>Gói &ldquo;Miễn phí&rdquo; luôn áp dụng cho chủ nhà có 1–3 phòng.</li>
          <li>Chu kỳ năm được giảm 20% so với chu kỳ tháng.</li>
        </ul>
      </div>
    </div>
  );
}
