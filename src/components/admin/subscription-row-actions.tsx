'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  freezeSubscriptionAction,
  markSubscriptionPaidAction,
  unfreezeSubscriptionAction,
} from '@/app/actions/subscriptions';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import type { SubscriptionStatus } from '@/core/entities/subscription';
import { formatVND } from '@/lib/format';

interface Props {
  subscriptionId: string;
  status: SubscriptionStatus;
  amount: number;
}

export function SubscriptionRowActions({
  subscriptionId,
  status,
  amount,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showFreeze, setShowFreeze] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [callNote, setCallNote] = useState('');
  const [confirmPaid, setConfirmPaid] = useState(false);

  function onSubmitCallNote() {
    if (callNote.trim().length < 3) return;
    // BE chưa có endpoint lưu ghi chú cuộc gọi → đây là nhắc việc tạm trên
    // trình duyệt, KHÔNG đồng bộ server. Toast nói đúng sự thật, không giả
    // vờ đã lưu. Khi BE ra endpoint sẽ wire vào use case thật.
    toast.success('Đã đánh dấu đã gọi (ghi chú tạm, chưa lưu server)');
    setCallOpen(false);
    setCallNote('');
  }

  function onMarkPaid() {
    setError(null);
    setConfirmPaid(false);
    startTransition(async () => {
      const r = await markSubscriptionPaidAction(subscriptionId, amount);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  function onFreeze() {
    if (reason.trim().length < 5) {
      setError('Lý do tối thiểu 5 ký tự');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await freezeSubscriptionAction(subscriptionId, reason.trim());
      if (!r.ok) setError(r.error);
      else {
        setShowFreeze(false);
        setReason('');
        router.refresh();
      }
    });
  }

  function onUnfreeze() {
    setError(null);
    startTransition(async () => {
      const r = await unfreezeSubscriptionAction(subscriptionId);
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {error && (
        <p className="text-[10px] text-rose-700 max-w-[200px]">{error}</p>
      )}

      {(status === 'past_due' || status === 'trial') && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => setConfirmPaid(true)}
          disabled={pending}
        >
          {pending ? '…' : '💰 Ghi nhận thu'}
        </Button>
      )}

      {status === 'past_due' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCallOpen(true)}
          disabled={pending}
        >
          📞 Đánh dấu đã gọi
        </Button>
      )}

      {status === 'frozen' && (
        <Button
          variant="outline"
          size="sm"
          onClick={onUnfreeze}
          disabled={pending}
        >
          🔓 Mở khoá
        </Button>
      )}

      {(status === 'active' || status === 'trial' || status === 'past_due') && !showFreeze && (
        <button
          type="button"
          onClick={() => setShowFreeze(true)}
          disabled={pending}
          className="text-[11px] text-ink-500 hover:text-rose-700"
        >
          Tạm khoá
        </button>
      )}

      {showFreeze && (
        <div className="w-56 rounded-lg bg-rose-50 p-2 ring-1 ring-rose-200">
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Lý do khoá…"
            className="text-xs"
          />
          <div className="mt-1 flex gap-1">
            <Button
              variant="danger"
              size="sm"
              onClick={onFreeze}
              disabled={pending}
            >
              Khoá
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowFreeze(false);
                setReason('');
                setError(null);
              }}
              disabled={pending}
            >
              Huỷ
            </Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmPaid}
        title="Xác nhận đã thu phí gói cước"
        description={`Ghi nhận đã thu ${formatVND(amount)} cho kỳ này. Subscription sẽ được gia hạn ngay. Chỉ xác nhận sau khi đã đối soát chuyển khoản.`}
        confirmLabel="Đã thu tiền"
        variant="primary"
        pending={pending}
        onConfirm={onMarkPaid}
        onCancel={() => setConfirmPaid(false)}
      />

      <Dialog
        open={callOpen}
        onOpenChange={(o: boolean) => {
          setCallOpen(o);
          if (!o) setCallNote('');
        }}
      >
        <DialogContent open={callOpen}>
          <DialogTitle>Ghi nhận đã gọi đòi nợ</DialogTitle>
          <DialogDescription>
            Lưu lại note nội bộ về cuộc gọi (chỉ admin xem).
          </DialogDescription>
          <div className="mt-4">
            <Textarea
              rows={3}
              value={callNote}
              onChange={(e) => setCallNote(e.target.value)}
              placeholder="VD: Đã gọi 3 lần, hứa chuyển TT trước thứ Sáu"
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCallOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="primary"
              disabled={callNote.trim().length < 3}
              onClick={onSubmitCallNote}
            >
              Lưu note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
