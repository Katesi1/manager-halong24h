'use client';

import { useState } from 'react';
import { Check, ArrowRight, X } from 'lucide-react';
import * as RDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';

import { formatVND } from '@/core/value-objects/vnd';
import type { SubscriptionPlan } from '@/core/entities/subscription';
import {
  PRICE_PER_ROOM,
  calcSubscriptionAmount,
  PLAN_LABEL,
} from '@/core/entities/subscription';
import { Badge } from '@/components/ui/badge';

interface TierDef {
  key: SubscriptionPlan;
  perks: string[];
  popular?: boolean;
}

const TIERS: TierDef[] = [
  {
    key: 'free',
    perks: [
      'Quản lý phòng + lịch',
      'Nhận yêu cầu khách qua liên hệ',
      'Đặt phòng không giới hạn',
    ],
  },
  {
    key: 'basic',
    perks: [
      'Tất cả tính năng gói Miễn phí',
      'Huy hiệu KYC đã xác minh',
      'Email xác nhận đặt phòng',
      'Báo cáo doanh thu nâng cao',
    ],
  },
  {
    key: 'standard',
    perks: [
      'Tất cả tính năng gói Cơ bản',
      'Kết nối API',
      'Nhiều nhân viên',
      'Hỗ trợ ưu tiên',
    ],
    popular: true,
  },
  {
    key: 'pro',
    perks: [
      'Tất cả tính năng gói Tiêu chuẩn',
      'Quản lý kênh phân phối',
      'Quản lý tài khoản riêng',
      'Cam kết uptime 99%',
    ],
  },
];

const ROOM_RANGE: Record<SubscriptionPlan, string> = {
  free: '1–3 phòng',
  basic: '4–10 phòng',
  standard: '11–30 phòng',
  pro: '31+ phòng',
};

const TIER_ORDER: SubscriptionPlan[] = ['free', 'basic', 'standard', 'pro'];

interface TierSelectorProps {
  currentPlan: SubscriptionPlan;
  roomCount: number;
}

export function TierSelector({ currentPlan, roomCount }: TierSelectorProps) {
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');

  const currentIdx = TIER_ORDER.indexOf(currentPlan);

  function handleSelect(plan: SubscriptionPlan) {
    if (plan === currentPlan) return;
    setSelectedPlan(plan);
  }

  return (
    <>
      {/* Cycle toggle */}
      <div className="flex items-center justify-center mb-6">
        <div className="inline-flex items-center rounded-lg bg-cream-100 p-0.5">
          <button
            onClick={() => setCycle('monthly')}
            className={
              'rounded-md px-4 py-2 text-sm font-medium transition-all ' +
              (cycle === 'monthly'
                ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
                : 'text-ink-500 hover:text-ink-900')
            }
          >
            Hàng tháng
          </button>
          <button
            onClick={() => setCycle('yearly')}
            className={
              'rounded-md px-4 py-2 text-sm font-medium transition-all ' +
              (cycle === 'yearly'
                ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
                : 'text-ink-500 hover:text-ink-900')
            }
          >
            Hàng năm
            <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              -20%
            </span>
          </button>
        </div>
      </div>

      {/* Tier grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TIERS.map((t) => {
          const isCurrent = t.key === currentPlan;
          const price = PRICE_PER_ROOM[t.key];
          const tierIdx = TIER_ORDER.indexOf(t.key);
          const isUpgrade = tierIdx > currentIdx;
          const isDowngrade = tierIdx < currentIdx && t.key !== currentPlan;
          const monthlyTotal = calcSubscriptionAmount(t.key, roomCount, 'monthly');
          const displayTotal = calcSubscriptionAmount(t.key, roomCount, cycle);

          return (
            <div
              key={t.key}
              className={
                'relative flex flex-col rounded-2xl bg-white p-5 transition-all cursor-pointer group ' +
                (isCurrent
                  ? 'ring-2 ring-navy-900 shadow-lg'
                  : t.popular
                    ? 'ring-2 ring-gold-400 shadow-md hover:shadow-lg'
                    : 'ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300 hover:shadow-md')
              }
              onClick={() => handleSelect(t.key)}
            >
              {isCurrent && (
                <Badge
                  variant="navy"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  Đang dùng
                </Badge>
              )}
              {t.popular && !isCurrent && (
                <Badge
                  variant="gold"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  Phổ biến
                </Badge>
              )}

              <h3 className="font-display text-xl font-bold text-navy-900">
                {PLAN_LABEL[t.key]}
              </h3>
              <p className="text-[11px] text-ink-500 mt-0.5">
                {ROOM_RANGE[t.key]}
              </p>

              <p className="mt-4 font-display text-2xl font-bold text-navy-900">
                {price > 0 ? formatVND(price) : '0 ₫'}
              </p>
              <p className="text-[11px] text-ink-500">
                {price > 0
                  ? `/phòng/${cycle === 'yearly' ? 'năm' : 'tháng'}`
                  : 'Không tính phí'}
              </p>

              {roomCount > 0 && price > 0 && (
                <p className="mt-1 text-xs text-gold-700 font-medium">
                  {roomCount} phòng = {formatVND(displayTotal)}
                  {cycle === 'yearly' ? '/năm' : '/tháng'}
                </p>
              )}

              <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-700">
                {t.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                    {p}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mt-4 rounded-lg bg-navy-50 px-3 py-2.5 text-center text-xs font-semibold text-navy-700">
                  Gói hiện tại của bạn
                </div>
              ) : isUpgrade ? (
                <button
                  type="button"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 active:scale-[0.98]"
                >
                  Nâng cấp
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              ) : isDowngrade ? (
                <button
                  type="button"
                  className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-cream-50"
                >
                  Hạ gói
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Confirmation modal */}
      <RDialog.Root
        open={selectedPlan !== null}
        onOpenChange={(o) => { if (!o) setSelectedPlan(null); }}
      >
        <AnimatePresence>
          {selectedPlan !== null && (
            <RDialog.Portal forceMount>
              <RDialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
              </RDialog.Overlay>
              <RDialog.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-ink-200 focus:outline-none"
                >
                  <ConfirmContent
                    from={currentPlan}
                    to={selectedPlan}
                    roomCount={roomCount}
                    cycle={cycle}
                    onClose={() => setSelectedPlan(null)}
                  />
                </motion.div>
              </RDialog.Content>
            </RDialog.Portal>
          )}
        </AnimatePresence>
      </RDialog.Root>
    </>
  );
}

function ConfirmContent({
  from,
  to,
  roomCount,
  cycle,
  onClose,
}: {
  from: SubscriptionPlan;
  to: SubscriptionPlan;
  roomCount: number;
  cycle: 'monthly' | 'yearly';
  onClose: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const isUpgrade = TIER_ORDER.indexOf(to) > TIER_ORDER.indexOf(from);
  const newAmount = calcSubscriptionAmount(to, roomCount, cycle);
  const oldAmount = calcSubscriptionAmount(from, roomCount, cycle);
  const diff = newAmount - oldAmount;

  async function handleConfirm() {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    setDone(true);
    setSubmitting(false);
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-50">
          <Check className="h-8 w-8 text-emerald-600" />
        </div>
        <p className="mt-4 font-display text-xl font-semibold text-navy-900">
          {isUpgrade ? 'Nâng cấp thành công!' : 'Đã chuyển gói!'}
        </p>
        <p className="mt-2 text-sm text-ink-500">
          Gói {PLAN_LABEL[to]} sẽ có hiệu lực từ kỳ thanh toán tiếp theo.
          {to !== 'free' && ' Vui lòng chuyển khoản theo thông tin bên dưới.'}
        </p>
        {to !== 'free' && (
          <div className="mt-4 rounded-lg bg-cream-100 p-4 text-left text-sm">
            <p className="font-semibold text-navy-900">Thông tin chuyển khoản</p>
            <p className="mt-1 text-ink-700">Ngân hàng: <strong>Vietcombank</strong></p>
            <p className="text-ink-700">STK: <strong>1234567890</strong></p>
            <p className="text-ink-700">Chủ TK: <strong>CONG TY HALONG24H</strong></p>
            <p className="text-ink-700">Số tiền: <strong>{formatVND(newAmount)}</strong></p>
            <p className="text-ink-700">
              Nội dung: <strong>GOI {to.toUpperCase()} {roomCount}P</strong>
            </p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-5 rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Đóng
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <RDialog.Title className="font-display text-xl font-semibold text-navy-900 pr-8">
          {isUpgrade ? 'Xác nhận nâng cấp' : 'Xác nhận hạ gói'}
        </RDialog.Title>
        <button
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-2 text-sm text-ink-500">
        Bạn đang chuyển từ gói <strong>{PLAN_LABEL[from]}</strong> sang{' '}
        <strong>{PLAN_LABEL[to]}</strong>.
      </p>

      {/* Comparison */}
      <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <PlanBox plan={from} amount={oldAmount} cycle={cycle} muted />
        <ArrowRight className="h-5 w-5 text-ink-300" />
        <PlanBox plan={to} amount={newAmount} cycle={cycle} />
      </div>

      {/* Cost diff */}
      <div className="mt-4 rounded-lg bg-cream-100 px-4 py-3 text-sm">
        {diff > 0 ? (
          <p className="text-ink-700">
            Chi phí {isUpgrade ? 'tăng thêm' : 'thay đổi'}:{' '}
            <strong className="text-navy-900">+{formatVND(diff)}/{cycle === 'yearly' ? 'năm' : 'tháng'}</strong>
          </p>
        ) : diff < 0 ? (
          <p className="text-ink-700">
            Tiết kiệm:{' '}
            <strong className="text-emerald-700">{formatVND(Math.abs(diff))}/{cycle === 'yearly' ? 'năm' : 'tháng'}</strong>
          </p>
        ) : (
          <p className="text-ink-700">Không thay đổi chi phí.</p>
        )}
        <p className="text-xs text-ink-500 mt-1">
          Áp dụng cho {roomCount} phòng đang hoạt động · {cycle === 'yearly' ? 'Thanh toán năm (giảm 20%)' : 'Thanh toán hàng tháng'}
        </p>
      </div>

      {/* Business rules */}
      <ul className="mt-4 space-y-1 text-xs text-ink-500">
        {isUpgrade && (
          <>
            <li>• Nâng cấp có hiệu lực ngay khi thanh toán được xác nhận.</li>
            <li>• Phần chênh lệch kỳ hiện tại sẽ được tính theo ngày còn lại.</li>
          </>
        )}
        {!isUpgrade && (
          <>
            <li>• Hạ gói có hiệu lực từ kỳ thanh toán tiếp theo.</li>
            <li>• Kỳ hiện tại bạn vẫn sử dụng đầy đủ tính năng gói cũ.</li>
            {to === 'free' && (
              <li>• Gói Miễn phí giới hạn tối đa 3 phòng. Phòng thừa sẽ bị ẩn.</li>
            )}
          </>
        )}
      </ul>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-lg border border-ink-200 px-4 py-2.5 text-sm font-medium text-ink-700 transition-colors hover:bg-cream-50"
        >
          Huỷ
        </button>
        <button
          onClick={handleConfirm}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-60"
        >
          {submitting ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {isUpgrade ? 'Xác nhận nâng cấp' : 'Xác nhận hạ gói'}
        </button>
      </div>
    </>
  );
}

function PlanBox({
  plan,
  amount,
  cycle,
  muted,
}: {
  plan: SubscriptionPlan;
  amount: number;
  cycle: 'monthly' | 'yearly';
  muted?: boolean;
}) {
  return (
    <div
      className={
        'rounded-lg border px-4 py-3 text-center ' +
        (muted
          ? 'border-ink-200 bg-cream-50 opacity-60'
          : 'border-navy-200 bg-navy-50')
      }
    >
      <p className="font-display text-lg font-bold text-navy-900">
        {PLAN_LABEL[plan]}
      </p>
      <p className="text-sm text-ink-700">
        {amount === 0 ? 'Miễn phí' : `${formatVND(amount)}/${cycle === 'yearly' ? 'năm' : 'tháng'}`}
      </p>
    </div>
  );
}
