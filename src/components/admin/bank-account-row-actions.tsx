'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';

import {
  approveBankAccountAction,
  rejectBankAccountAction,
} from '@/app/actions/bank-accounts';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import type { BankDetails, BankStatus } from '@/core/entities/bank-account';

interface Props {
  userId: string;
  ownerName: string;
  status: BankStatus;
  /** STK đang chờ duyệt — hiển thị trong hộp xác nhận. */
  pending: BankDetails | null;
}

function detailLine(d: BankDetails | null): string {
  if (!d) return '—';
  const parts = [d.bankName, d.bankAccountNumber, d.bankAccountName].filter(
    Boolean,
  );
  return parts.length ? parts.join(' · ') : '—';
}

export function BankAccountRowActions({
  userId,
  ownerName,
  status,
  pending,
}: Props) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  // Chỉ duyệt/từ chối được khi có yêu cầu đang chờ (spec: 400 bankNoPending nếu không).
  const canModerate = status === 'pending';

  function handleApprove() {
    startTransition(async () => {
      const r = await approveBankAccountAction(userId);
      if (!r.ok) {
        toast.error('Duyệt thất bại: ' + r.error);
      } else {
        toast.success(`Đã duyệt tài khoản nhận tiền của ${ownerName}`);
        setShowApprove(false);
        router.refresh();
      }
    });
  }

  function handleReject() {
    const trimmed = reason.trim();
    if (trimmed.length < 5) {
      setRejectError('Lý do từ chối tối thiểu 5 ký tự');
      return;
    }
    setRejectError(null);
    startTransition(async () => {
      const r = await rejectBankAccountAction(userId, trimmed);
      if (!r.ok) {
        setRejectError(r.error);
        toast.error('Từ chối thất bại: ' + r.error);
      } else {
        toast.success(`Đã từ chối tài khoản nhận tiền của ${ownerName}`);
        setShowReject(false);
        setReason('');
        router.refresh();
      }
    });
  }

  if (!canModerate) {
    return <span className="text-xs text-ink-400">—</span>;
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => setShowApprove(true)}
        disabled={busy}
        title="Duyệt tài khoản nhận tiền"
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-600 hover:text-white hover:ring-emerald-600 disabled:opacity-50"
      >
        <Check className="h-3.5 w-3.5" />
        Duyệt
      </button>
      <button
        type="button"
        onClick={() => setShowReject(true)}
        disabled={busy}
        title="Từ chối"
        className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-600 hover:text-white hover:ring-rose-600 disabled:opacity-50"
      >
        <X className="h-3.5 w-3.5" />
        Từ chối
      </button>

      <ConfirmDialog
        open={showApprove}
        title="Duyệt tài khoản nhận tiền"
        description={`Xác nhận duyệt STK của ${ownerName}?\n${detailLine(pending)}\nSau khi duyệt, số tài khoản này sẽ được dùng sinh VietQR cho khách trả cọc.`}
        confirmLabel="Xác nhận duyệt"
        variant="primary"
        pending={busy}
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      <Dialog
        open={showReject}
        onOpenChange={(o) => {
          if (!o && !busy) {
            setShowReject(false);
            setReason('');
            setRejectError(null);
          }
        }}
      >
        <DialogContent open={showReject}>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Từ chối tài khoản nhận tiền
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Chủ nhà: <span className="font-semibold">{ownerName}</span>
          </p>
          <p className="mt-1 text-xs text-ink-500">{detailLine(pending)}</p>
          <p className="mt-3 text-xs text-ink-500">
            Nhập lý do cụ thể (tối thiểu 5 ký tự, sẽ gửi cho chủ nhà):
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            disabled={busy}
            placeholder="VD: Tên chủ tài khoản không khớp CCCD đã xác minh, vui lòng cung cấp STK chính chủ"
            className="mt-2"
          />
          {rejectError && (
            <p className="mt-2 text-xs text-rose-600">{rejectError}</p>
          )}
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowReject(false);
                setReason('');
                setRejectError(null);
              }}
              disabled={busy}
            >
              Huỷ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleReject}
              disabled={busy}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {busy ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
