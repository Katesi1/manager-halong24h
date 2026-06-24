'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  rejectDisputeAction,
  resolveDisputeAction,
  startDisputeInvestigationAction,
} from '@/app/actions/disputes';
import { Button } from '@/components/ui/button';
import { Input, Label, Textarea } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import {
  DISPUTE_PENALTY_LABEL,
  PENALTY_LABEL,
  VERDICT_LABEL,
  type DisputePenalty,
  type DisputeStatus,
  type DisputeVerdict,
  type PenaltyType,
} from '@/core/entities/dispute';
import { cn } from '@/lib/utils';

interface Props {
  disputeId: string;
  status: DisputeStatus;
}

const VERDICTS: DisputeVerdict[] = [
  'favor_customer',
  'favor_owner',
  'split',
  'no_fault',
];

/** Hard cap để chặn input cực lớn. TODO: clamp theo bookingTotal khi BE expose. */
const REFUND_MAX = 1_000_000_000;

const PENALTIES: PenaltyType[] = [
  'none',
  'warn',
  'rating_down',
  'ban_temp',
  'ban_permanent',
  'kyc_revoke',
  'refund_required',
];

/** Mức xử phạt BE lưu (enum phẳng). Chọn KHÔNG tự ban — admin ban riêng. */
const PENALTY_ACTIONS: DisputePenalty[] = [
  'none',
  'warning',
  'refund',
  'ban_temp',
  'ban_perm',
];

export function DisputeResolutionForm({ disputeId, status }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<'view' | 'resolve' | 'reject'>('view');

  // Resolve form state
  const [verdict, setVerdict] = useState<DisputeVerdict>('favor_customer');
  const [penaltyType, setPenaltyType] = useState<PenaltyType>('warn');
  const [penaltyTarget, setPenaltyTarget] = useState<'customer' | 'owner'>(
    'owner',
  );
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [durationDays, setDurationDays] = useState<string>('');
  const [penaltyAction, setPenaltyAction] = useState<DisputePenalty>('none');
  const [resolution, setResolution] = useState('');

  // Reject form
  const [rejectReason, setRejectReason] = useState('');

  function onStartInvestigation() {
    startTransition(async () => {
      const r = await startDisputeInvestigationAction(disputeId);
      if (!r.ok) show(r.error || 'Có lỗi', 'error');
      else {
        show('✓ Đã chuyển sang Đang xử lý', 'success');
        router.refresh();
      }
    });
  }

  function onResolve() {
    if (resolution.trim().length < 10) {
      show('Phán quyết tối thiểu 10 ký tự', 'warning');
      return;
    }
    startTransition(async () => {
      const r = await resolveDisputeAction({
        disputeId,
        verdict,
        penalty: {
          type: penaltyType,
          target: penaltyType === 'none' ? null : penaltyTarget,
          durationDays: durationDays ? Number(durationDays) : undefined,
          refundAmount: refundAmount ? Number(refundAmount) : undefined,
        },
        penaltyAction,
        resolution: resolution.trim(),
      });
      if (!r.ok) show(r.error || 'Có lỗi', 'error');
      else {
        show('✓ Đã ra phán quyết', 'success');
        setMode('view');
        router.refresh();
      }
    });
  }

  function onReject() {
    if (rejectReason.trim().length < 10) {
      show('Lý do tối thiểu 10 ký tự', 'warning');
      return;
    }
    startTransition(async () => {
      const r = await rejectDisputeAction({
        disputeId,
        reason: rejectReason.trim(),
      });
      if (!r.ok) show(r.error || 'Có lỗi', 'error');
      else {
        show('Đã bác bỏ khiếu nại', 'success');
        setMode('view');
        setRejectReason('');
        router.refresh();
      }
    });
  }

  if (status === 'resolved' || status === 'rejected') {
    return (
      <p className="rounded-md bg-cream-100 px-3 py-2 text-xs text-ink-700">
        Khiếu nại đã đóng. Không thể chỉnh sửa phán quyết.
      </p>
    );
  }

  if (mode === 'view') {
    return (
      <div className="space-y-2">
        {status === 'open' && (
          <Button
            onClick={onStartInvestigation}
            disabled={pending}
            variant="outline"
            className="w-full"
          >
            🔍 Bắt đầu xử lý
          </Button>
        )}
        <Button
          onClick={() => setMode('resolve')}
          disabled={pending}
          className="w-full"
        >
          ⚖️ Ra phán quyết
        </Button>
        <Button
          onClick={() => setMode('reject')}
          disabled={pending}
          variant="outline"
          className="w-full"
        >
          ✕ Bác bỏ khiếu nại
        </Button>
      </div>
    );
  }

  if (mode === 'reject') {
    return (
      <div className="space-y-3 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-200">
        <Label htmlFor="reject_reason">Lý do bác bỏ</Label>
        <Textarea
          id="reject_reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          rows={4}
          placeholder="VD: Bằng chứng không đủ. Chat thể hiện đã có thoả thuận trước đó về việc đổi phòng…"
        />
        <div className="flex gap-2">
          <Button
            variant="danger"
            onClick={onReject}
            disabled={pending}
            className="flex-1"
          >
            {pending ? 'Đang gửi…' : 'Xác nhận bác bỏ'}
          </Button>
          <Button variant="ghost" onClick={() => setMode('view')}>
            Huỷ
          </Button>
        </div>
      </div>
    );
  }

  // Resolve mode — ô hoàn tiền hiện khi mức phạt BE = refund (giá trị thật gửi
  // BE) HOẶC khi chọn hình thức nội bộ refund_required.
  const needsRefund =
    penaltyType === 'refund_required' || penaltyAction === 'refund';
  const needsDuration = penaltyType === 'ban_temp';

  return (
    <div className="space-y-4 rounded-lg bg-cream-100 p-4 ring-1 ring-ink-200">
      <fieldset>
        <legend className="sr-only">Phán quyết</legend>
        <Label aria-hidden="true">Phán quyết</Label>
        <div className="mt-2 grid gap-2">
          {VERDICTS.map((v) => (
            <label
              key={v}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg border-2 p-3 text-sm transition-all',
                verdict === v
                  ? 'border-navy-900 bg-navy-50'
                  : 'border-ink-200 bg-white hover:border-ink-400',
              )}
            >
              <input
                type="radio"
                name="verdict"
                checked={verdict === v}
                onChange={() => setVerdict(v)}
              />
              <span className="font-medium">{VERDICT_LABEL[v]}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <Label htmlFor="penalty">Hình thức xử phạt</Label>
        <select
          id="penalty"
          value={penaltyType}
          onChange={(e) => setPenaltyType(e.target.value as PenaltyType)}
          className="mt-2 h-11 w-full rounded-[10px] border border-ink-300 bg-white px-3 text-sm"
        >
          {PENALTIES.map((p) => (
            <option key={p} value={p}>
              {PENALTY_LABEL[p]}
            </option>
          ))}
        </select>
      </div>

      {penaltyType !== 'none' && (
        <fieldset>
          <legend className="sr-only">Đối tượng bị phạt</legend>
          <Label aria-hidden="true">Đối tượng bị phạt</Label>
          <div className="mt-2 flex gap-2">
            {(['customer', 'owner'] as const).map((t) => (
              <label
                key={t}
                className={cn(
                  'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 p-3 text-sm transition-all',
                  penaltyTarget === t
                    ? 'border-navy-900 bg-navy-50'
                    : 'border-ink-200 bg-white hover:border-ink-400',
                )}
              >
                <input
                  type="radio"
                  name="target"
                  checked={penaltyTarget === t}
                  onChange={() => setPenaltyTarget(t)}
                />
                <span className="font-medium">
                  {t === 'customer' ? 'Khách' : 'Chủ nhà'}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {needsRefund && (
        <div>
          <Label htmlFor="refund_amount">Số tiền hoàn (VNĐ)</Label>
          <Input
            id="refund_amount"
            type="number"
            min={0}
            max={REFUND_MAX}
            step={100000}
            value={refundAmount}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') {
                setRefundAmount('');
                return;
              }
              const num = Number(raw);
              if (!Number.isFinite(num) || num < 0) return;
              const clamped = Math.min(REFUND_MAX, Math.max(0, num));
              setRefundAmount(String(clamped));
            }}
            placeholder="VD: 1500000"
          />
          <p className="mt-1 text-[11px] text-ink-500">
            Hệ thống KHÔNG xử lý hoàn tiền tự động. Chủ nhà sẽ nhận thông báo
            yêu cầu chuyển khoản cho khách trong vòng 7 ngày.
          </p>
        </div>
      )}

      {needsDuration && (
        <div>
          <Label htmlFor="duration_days">Thời hạn ban (ngày)</Label>
          <Input
            id="duration_days"
            type="number"
            min={1}
            value={durationDays}
            onChange={(e) => setDurationDays(e.target.value)}
            placeholder="30"
          />
        </div>
      )}

      <div>
        <Label htmlFor="resolution">Phán quyết chi tiết (gửi cả 2 bên)</Label>
        <Textarea
          id="resolution"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          rows={4}
          placeholder="VD: Sau khi đọc chat + bill, chủ nhà thừa nhận đã đổi phòng nhưng không thông báo trước. Yêu cầu chủ nhà hoàn 50% (2.250.000đ) cho khách trong 7 ngày…"
        />
      </div>

      <div>
        <Label htmlFor="penalty_action">Mức xử phạt lưu hồ sơ</Label>
        <select
          id="penalty_action"
          value={penaltyAction}
          onChange={(e) =>
            setPenaltyAction(e.target.value as DisputePenalty)
          }
          className="mt-2 h-11 w-full rounded-[10px] border border-ink-300 bg-white px-3 text-sm"
        >
          {PENALTY_ACTIONS.map((p) => (
            <option key={p} value={p}>
              {DISPUTE_PENALTY_LABEL[p]}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-ink-500">
          Chọn mức phạt KHÔNG tự động khoá tài khoản — nếu cần ban, hãy thực
          hiện riêng ở trang người dùng.
        </p>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          variant="primary"
          onClick={onResolve}
          disabled={pending}
          className="flex-1"
        >
          {pending ? 'Đang gửi…' : '⚖️ Xác nhận phán quyết'}
        </Button>
        <Button variant="ghost" onClick={() => setMode('view')}>
          Huỷ
        </Button>
      </div>
    </div>
  );
}
