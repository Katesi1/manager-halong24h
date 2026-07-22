'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, Loader2 } from 'lucide-react';

import { listBillingPlansAction } from '@/app/actions/billing-plans';
import {
  getSubscriptionAction,
  upgradeOwnerSubscriptionAction,
} from '@/app/actions/subscriptions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input, Label, Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import {
  planLabel,
  type BillingPlan,
} from '@/core/entities/billing-plan';
import type { Subscription, SubscriptionCycle } from '@/core/entities/subscription';
import { formatDate, formatVND } from '@/lib/format';
import { refetchApiResources } from '@/lib/use-api-resource';

interface Props {
  /** OWNER userId. */
  userId: string;
  ownerName?: string;
}

const MONTHLY_DAYS = 30;
const YEARLY_DAYS = 365;

function priceForCycle(plan: BillingPlan | undefined, cycle: SubscriptionCycle): number {
  if (!plan) return 0;
  return cycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
}

function defaultRooms(plan: BillingPlan | undefined, fallback: number): number {
  if (plan && plan.rooms > 0) return plan.rooms;
  return fallback > 0 ? fallback : 1;
}

/**
 * Nút "Nâng gói / Ghi nhận thanh toán" — admin nâng/đổi gói cho OWNER khi chủ
 * nhà đưa tiền trực tiếp (tiền mặt / CK ngoài app). Gọi mark-paid với đầy đủ
 * planId/cycle/rooms/days. BE tự kích hoạt gói + gia hạn + gửi push.
 */
export function SubscriptionUpgradeButton({ userId, ownerName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [current, setCurrent] = useState<Subscription | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [planId, setPlanId] = useState('');
  const [cycle, setCycle] = useState<SubscriptionCycle>('monthly');
  const [rooms, setRooms] = useState(1);
  const [amount, setAmount] = useState(0);
  const [days, setDays] = useState(MONTHLY_DAYS);
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [planRes, subRes] = await Promise.all([
      listBillingPlansAction(),
      getSubscriptionAction(userId),
    ]);
    if (!planRes.ok) {
      setLoadError(planRes.error || 'Không tải được danh sách gói');
      setLoading(false);
      return;
    }
    const list = planRes.data;
    const sub = subRes.ok ? subRes.data : null;
    setPlans(list);
    setCurrent(sub);

    // Prefill: mặc định chọn gói hiện tại nếu còn trong danh mục active.
    const currentInList = sub && list.some((p) => p.id === sub.planId);
    const initialPlan = currentInList
      ? list.find((p) => p.id === sub!.planId)!
      : list[0];
    const initialCycle: SubscriptionCycle = sub?.cycle ?? 'monthly';
    setPlanId(initialPlan?.id ?? '');
    setCycle(initialCycle);
    setRooms(defaultRooms(initialPlan, sub?.roomCount ?? 0));
    setAmount(priceForCycle(initialPlan, initialCycle));
    setDays(initialCycle === 'yearly' ? YEARLY_DAYS : MONTHLY_DAYS);
    setLoading(false);
  }, [userId]);

  function openDialog() {
    setError(null);
    setReference('');
    setNote('');
    setOpen(true);
    void load();
  }

  const selectedPlan = plans.find((p) => p.id === planId);

  function onChangePlan(id: string) {
    setPlanId(id);
    const plan = plans.find((p) => p.id === id);
    setRooms(defaultRooms(plan, current?.roomCount ?? 0));
    setAmount(priceForCycle(plan, cycle));
  }

  function onChangeCycle(c: SubscriptionCycle) {
    setCycle(c);
    setDays(c === 'yearly' ? YEARLY_DAYS : MONTHLY_DAYS);
    setAmount(priceForCycle(selectedPlan, c));
  }

  function onAmountChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    setAmount(digits ? parseInt(digits, 10) : 0);
  }

  function onSubmit() {
    setError(null);
    if (!planId) {
      setError('Vui lòng chọn gói');
      return;
    }
    if (amount <= 0) {
      setError('Số tiền phải lớn hơn 0');
      return;
    }
    if (rooms < 1) {
      setError('Số phòng phải từ 1 trở lên');
      return;
    }
    startTransition(async () => {
      const r = await upgradeOwnerSubscriptionAction(userId, {
        amount,
        planId,
        cycle,
        rooms,
        days,
        reference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      if (!r.ok) {
        setError(r.error);
        return;
      }
      const endsAt = r.data.expireAt;
      toast.success(
        endsAt
          ? `Đã nâng gói — hạn mới đến ${formatDate(endsAt)}`
          : 'Đã nâng gói cho chủ nhà',
      );
      setOpen(false);
      router.refresh();
      refetchApiResources();
    });
  }

  return (
    <div>
      <Button variant="primary" size="sm" onClick={openDialog}>
        <ArrowUpCircle className="mr-1.5 h-4 w-4" />
        Nâng gói / Ghi nhận thanh toán
      </Button>

      <Dialog
        open={open}
        onOpenChange={(o: boolean) => {
          if (!pending) setOpen(o);
        }}
      >
        <DialogContent open={open} className="max-w-lg">
          <DialogTitle>Nâng gói cho chủ nhà</DialogTitle>
          <DialogDescription>
            Ghi nhận tiền chủ nhà{ownerName ? ` (${ownerName})` : ''} đưa trực
            tiếp (tiền mặt / CK ngoài app) và nâng gói ngay.
          </DialogDescription>

          {loading ? (
            <div className="flex items-center gap-2 py-10 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải thông tin gói…
            </div>
          ) : loadError ? (
            <div className="py-6">
              <p className="text-sm text-rose-700">{loadError}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => void load()}
              >
                Thử lại
              </Button>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Gói hiện tại — tham chiếu cho admin */}
              <div className="rounded-lg bg-cream-100 px-3 py-2 text-xs text-ink-600">
                Gói hiện tại:{' '}
                <span className="font-medium text-navy-900">
                  {current?.planId ? planLabel(current.planId) : 'Chưa có gói'}
                </span>
                {current?.expireAt && (
                  <>
                    {' · '}Hết hạn:{' '}
                    <span className="font-medium text-navy-900">
                      {formatDate(current.expireAt)}
                    </span>
                  </>
                )}
                <p className="mt-1 text-[11px] text-ink-500">
                  Cộng dồn kỳ hạn: hạn mới = hạn cũ (nếu còn) + số ngày gia hạn.
                </p>
              </div>

              <div>
                <Label htmlFor="up-plan" required>
                  Gói cước
                </Label>
                <select
                  id="up-plan"
                  value={planId}
                  onChange={(e) => onChangePlan(e.target.value)}
                  disabled={pending}
                  className="h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {planLabel(p.id)}
                      {p.rooms > 0 ? ` · ${p.rooms} phòng` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label required>Chu kỳ</Label>
                <div className="inline-flex rounded-lg bg-cream-100 p-0.5">
                  {(['monthly', 'yearly'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      disabled={pending}
                      onClick={() => onChangeCycle(c)}
                      className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                        cycle === c
                          ? 'bg-white text-navy-900 shadow-sm'
                          : 'text-ink-500 hover:text-ink-700'
                      }`}
                    >
                      {c === 'monthly' ? 'Tháng' : 'Năm'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="up-rooms" required>
                    Số phòng
                  </Label>
                  <Input
                    id="up-rooms"
                    type="number"
                    min={1}
                    value={rooms}
                    disabled={pending}
                    onChange={(e) =>
                      setRooms(Math.max(1, parseInt(e.target.value || '1', 10)))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="up-days" required>
                    Số ngày gia hạn
                  </Label>
                  <Input
                    id="up-days"
                    type="number"
                    min={1}
                    max={3650}
                    value={days}
                    disabled={pending}
                    onChange={(e) =>
                      setDays(Math.max(1, parseInt(e.target.value || '1', 10)))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="up-amount" required>
                  Số tiền nhận (VND)
                </Label>
                <Input
                  id="up-amount"
                  inputMode="numeric"
                  value={amount ? amount.toLocaleString('vi-VN') : ''}
                  placeholder="0"
                  disabled={pending}
                  onChange={(e) => onAmountChange(e.target.value)}
                />
                {selectedPlan && (
                  <p className="mt-1 text-[11px] text-ink-500">
                    Giá niêm yết {cycle === 'yearly' ? 'năm' : 'tháng'} (chưa VAT):{' '}
                    {formatVND(priceForCycle(selectedPlan, cycle))}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="up-ref">Mã biên nhận (tuỳ chọn)</Label>
                  <Input
                    id="up-ref"
                    value={reference}
                    placeholder="TIEN_MAT / mã CK"
                    maxLength={200}
                    disabled={pending}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="up-note">Ghi chú (tuỳ chọn)</Label>
                <Textarea
                  id="up-note"
                  rows={2}
                  value={note}
                  maxLength={2000}
                  placeholder="VD: Chủ nhà đưa tiền mặt tại văn phòng"
                  disabled={pending}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {error && <p className="text-sm text-rose-700">{error}</p>}

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setOpen(false)}
                >
                  Huỷ
                </Button>
                <Button variant="primary" disabled={pending} onClick={onSubmit}>
                  {pending ? '…' : 'Nâng gói / Ghi nhận'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
