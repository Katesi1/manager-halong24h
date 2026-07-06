'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import * as RDialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';

import { startPlanPaymentAction } from '@/app/actions/payments-purchase';
import { formatVND } from '@/core/value-objects/vnd';
import {
  POPULAR_PLAN_ID,
  planLabel,
  yearlySavingsPercent,
  type BillingPlan,
} from '@/core/entities/billing-plan';
import type { PaymentInitiateResult } from '@/core/entities/payment-session';
import { Badge } from '@/components/ui/badge';
import { vietQRImageUrlFor } from '@/lib/vietqr';

type Cycle = 'monthly' | 'yearly';

interface TierSelectorProps {
  /** Danh mục gói cước do admin quản lý (`/billing/plans`). */
  plans: BillingPlan[];
  /** Id gói hiện tại của chủ nhà (null nếu chưa có). */
  currentPlanId: string | null;
}

function roomsLabel(plan: BillingPlan): string {
  if (plan.rooms == null) return '—';
  if (plan.rooms === -1) return 'Không giới hạn';
  return `${plan.rooms} phòng`;
}

function priceFor(plan: BillingPlan, cycle: Cycle): number {
  return cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

export function TierSelector({ plans, currentPlanId }: TierSelectorProps) {
  const [selected, setSelected] = useState<BillingPlan | null>(null);
  const [cycle, setCycle] = useState<Cycle>('monthly');

  return (
    <>
      {/* Cycle toggle */}
      <div className="mb-6 flex items-center justify-center">
        <div className="inline-flex items-center rounded-lg bg-cream-100 p-0.5">
          {(['monthly', 'yearly'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={
                'rounded-md px-4 py-2 text-sm font-medium transition-all ' +
                (cycle === c
                  ? 'bg-white text-navy-900 shadow-sm ring-1 ring-ink-200/60'
                  : 'text-ink-500 hover:text-ink-900')
              }
            >
              {c === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
            </button>
          ))}
        </div>
      </div>

      {/* Plan grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const isPopular = plan.id === POPULAR_PLAN_ID;
          const price = priceFor(plan, cycle);
          const isContact = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
          const savings = yearlySavingsPercent(plan);

          return (
            <button
              type="button"
              key={plan.id}
              onClick={() => !isCurrent && setSelected(plan)}
              disabled={isCurrent}
              className={
                'relative flex flex-col rounded-2xl bg-white p-5 text-left transition-all ' +
                (isCurrent
                  ? 'ring-2 ring-navy-900 shadow-lg cursor-default'
                  : isPopular
                    ? 'ring-2 ring-gold-400 shadow-md hover:shadow-lg'
                    : 'ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300 hover:shadow-md')
              }
            >
              {isCurrent ? (
                <Badge
                  variant="navy"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  Đang dùng
                </Badge>
              ) : isPopular ? (
                <Badge
                  variant="gold"
                  className="absolute -top-2.5 left-1/2 -translate-x-1/2"
                >
                  Phổ biến
                </Badge>
              ) : null}

              <h3 className="font-display text-xl font-bold text-navy-900">
                {planLabel(plan.id)}
              </h3>
              <p className="mt-0.5 text-[11px] text-ink-500">{roomsLabel(plan)}</p>

              <p className="mt-4 font-display text-2xl font-bold text-navy-900">
                {isContact ? 'Liên hệ' : price ? formatVND(price) : '—'}
              </p>
              <p className="text-[11px] text-ink-500">
                {isContact
                  ? 'Báo giá theo hợp đồng'
                  : price
                    ? `/ ${cycle === 'yearly' ? 'năm' : 'tháng'} (chưa VAT)`
                    : 'Chưa cấu hình giá'}
              </p>
              {cycle === 'yearly' && savings > 0 && (
                <p className="mt-1 text-xs font-medium text-emerald-700">
                  Tiết kiệm {savings}% so với trả tháng
                </p>
              )}

              <ul className="mt-4 flex-1 space-y-1.5 text-xs text-ink-700">
                {plan.features?.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="mt-4 rounded-lg bg-navy-50 px-3 py-2.5 text-center text-xs font-semibold text-navy-700">
                  Gói hiện tại của bạn
                </div>
              ) : (
                <div className="mt-4 rounded-lg bg-navy-900 px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors group-hover:bg-navy-800">
                  Chọn gói này
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Confirm / bank-transfer dialog */}
      <RDialog.Root
        open={selected !== null}
        onOpenChange={(o) => {
          if (!o) setSelected(null);
        }}
      >
        <AnimatePresence>
          {selected !== null && (
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
                  className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-ink-200 focus:outline-none"
                >
                  <PlanTransferInfo
                    plan={selected}
                    cycle={cycle}
                    onClose={() => setSelected(null)}
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

type LoadState =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; session: PaymentInitiateResult; alreadyPending: boolean };

function PlanTransferInfo({
  plan,
  cycle,
  onClose,
}: {
  plan: BillingPlan;
  cycle: Cycle;
  onClose: () => void;
}) {
  const isContact = plan.monthlyPrice === 0 && plan.yearlyPrice === 0;
  const [state, setState] = useState<LoadState>({ phase: 'loading' });
  // Chỉ tạo phiên đúng 1 lần khi mở dialog (component remount mỗi lần chọn gói).
  const startedRef = useRef(false);

  useEffect(() => {
    if (isContact || startedRef.current) return;
    startedRef.current = true;
    startPlanPaymentAction({ planId: plan.id, cycle })
      .then((res) => {
        if (res.ok) {
          setState({
            phase: 'ready',
            session: res.data.session,
            alreadyPending: res.data.alreadyPending,
          });
        } else {
          setState({ phase: 'error', message: res.error });
        }
      })
      .catch(() =>
        setState({
          phase: 'error',
          message: 'Không tạo được phiên thanh toán. Vui lòng thử lại.',
        }),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div className="flex items-center justify-between">
        <RDialog.Title className="font-display text-xl font-semibold text-navy-900 pr-8">
          Đăng ký gói {planLabel(plan.id)}
        </RDialog.Title>
        <button
          type="button"
          onClick={onClose}
          className="grid h-9 w-9 place-items-center rounded-full transition-colors hover:bg-cream-200"
          aria-label="Đóng"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {isContact ? (
        <p className="mt-3 text-sm text-ink-700">
          Gói này tính phí theo hợp đồng. Vui lòng liên hệ Halong24h để được báo
          giá và kích hoạt.
        </p>
      ) : state.phase === 'loading' ? (
        <div className="flex items-center gap-2 py-8 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Đang tạo phiên thanh toán…
        </div>
      ) : state.phase === 'error' ? (
        <p className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {state.message}
        </p>
      ) : (
        <PaymentSessionView session={state.session} pending={state.alreadyPending} />
      )}

      <p className="mt-4 text-xs text-ink-500">
        Sau khi chuyển khoản, admin sẽ xác nhận và kích hoạt gói cho bạn.
      </p>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800"
        >
          Đã hiểu
        </button>
      </div>
    </>
  );
}

/** Hiển thị STK nền tảng THẬT + QR + nội dung CK từ phiên đã tạo. */
function PaymentSessionView({
  session,
  pending,
}: {
  session: PaymentInitiateResult;
  pending: boolean;
}) {
  const { bankInfo, totalAmount, ckContent } = session;
  const hasBank = Boolean(bankInfo.bankBin && bankInfo.accountNumber);
  const qrUrl = vietQRImageUrlFor({
    bankBin: bankInfo.bankBin,
    accountNumber: bankInfo.accountNumber,
    accountName: bankInfo.accountName,
    amount: totalAmount,
    memo: ckContent,
  });

  return (
    <>
      {pending && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 ring-1 ring-amber-200">
          Bạn đang có một phiên thanh toán chờ xác nhận cho gói{' '}
          <strong>{session.planLabel}</strong>. Vui lòng hoàn tất chuyển khoản
          bên dưới.
        </p>
      )}

      <p className="mt-2 text-sm text-ink-500">Số tiền cần thanh toán:</p>
      <p className="mt-1 font-display text-2xl font-bold text-navy-900">
        {formatVND(totalAmount)}
        <span className="ml-1 text-xs font-normal text-ink-500">đã gồm VAT</span>
      </p>

      {!hasBank && (
        <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          Chưa cấu hình tài khoản nhận tiền. Vui lòng liên hệ Halong24h để hoàn
          tất thanh toán.
        </p>
      )}

      <div
        className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start"
        hidden={!hasBank}
      >
        <div className="rounded-lg bg-cream-100 p-4 text-sm">
          <p className="font-semibold text-navy-900">Thông tin chuyển khoản</p>
          <p className="mt-1 text-ink-700">
            Ngân hàng: <strong>{bankInfo.bankName ?? '—'}</strong>
          </p>
          <p className="text-ink-700">
            STK: <strong>{bankInfo.accountNumber ?? '—'}</strong>
          </p>
          <p className="text-ink-700">
            Chủ TK: <strong>{bankInfo.accountName ?? '—'}</strong>
          </p>
          <p className="text-ink-700">
            Nội dung: <strong className="break-all">{ckContent || '—'}</strong>
          </p>
          <p className="mt-2 text-[11px] text-ink-500">
            Nhập đúng nội dung CK để hệ thống đối soát tự động.
          </p>
        </div>

        {qrUrl && (
          <div className="mx-auto flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Mã VietQR thanh toán"
              width={160}
              height={160}
              className="h-40 w-40 rounded-lg ring-1 ring-ink-200"
            />
            <span className="mt-1 text-[11px] text-ink-500">Quét để chuyển khoản</span>
          </div>
        )}
      </div>
    </>
  );
}
