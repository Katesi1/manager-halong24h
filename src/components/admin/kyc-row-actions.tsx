'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X } from 'lucide-react';

import {
  approveKycAdminAction,
  rejectKycAdminAction,
} from '@/app/actions/kyc-admin';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import type { KycSubmissionStatus } from '@/core/entities/kyc';

interface Props {
  submissionId: string;
  status: KycSubmissionStatus;
  ownerName: string;
}

const MODERATABLE: KycSubmissionStatus[] = [
  'awaiting_approval',
  'kyc_submitted',
  'paid',
];

export function KycRowActions({ submissionId, status, ownerName }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);

  const canModerate = MODERATABLE.includes(status);

  function handleApprove() {
    startTransition(async () => {
      const r = await approveKycAdminAction(submissionId);
      if (!r.ok) {
        toast.error('Duyệt thất bại: ' + r.error);
      } else {
        toast.success(`Đã duyệt KYC: ${ownerName}`);
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
      const r = await rejectKycAdminAction(submissionId, trimmed);
      if (!r.ok) {
        setRejectError(r.error);
        toast.error('Từ chối thất bại: ' + r.error);
      } else {
        toast.success(`Đã từ chối KYC: ${ownerName}`);
        setShowReject(false);
        setReason('');
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      {canModerate && (
        <>
          <button
            type="button"
            onClick={() => setShowApprove(true)}
            disabled={pending}
            title="Duyệt nhanh"
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-600 hover:text-white hover:ring-emerald-600 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Duyệt
          </button>
          <button
            type="button"
            onClick={() => setShowReject(true)}
            disabled={pending}
            title="Từ chối"
            className="inline-flex h-8 items-center gap-1 rounded-lg bg-rose-50 px-2.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition-colors hover:bg-rose-600 hover:text-white hover:ring-rose-600 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Từ chối
          </button>
        </>
      )}
      <Link
        href={`/admin/kyc/${submissionId}`}
        className="inline-flex h-8 items-center rounded-lg bg-cream-100 px-2.5 text-xs font-semibold text-navy-800 transition-colors hover:bg-navy-900 hover:text-white"
      >
        Xem
      </Link>

      <ConfirmDialog
        open={showApprove}
        title="Duyệt hồ sơ KYC"
        description={`Xác nhận duyệt KYC cho ${ownerName}? Chủ nhà sẽ được phép tạo cơ sở và nhận booking.`}
        confirmLabel="Xác nhận duyệt"
        variant="primary"
        pending={pending}
        onConfirm={handleApprove}
        onCancel={() => setShowApprove(false)}
      />

      <Dialog
        open={showReject}
        onOpenChange={(o) => {
          if (!o && !pending) {
            setShowReject(false);
            setReason('');
            setRejectError(null);
          }
        }}
      >
        <DialogContent open={showReject}>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Từ chối hồ sơ KYC
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Chủ nhà: <span className="font-semibold">{ownerName}</span>
          </p>
          <p className="mt-3 text-xs text-ink-500">
            Nhập lý do cụ thể (tối thiểu 5 ký tự, sẽ gửi cho chủ nhà):
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            disabled={pending}
            placeholder="VD: STK ngân hàng không khớp tên CCCD, vui lòng cung cấp STK chính chủ"
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
              disabled={pending}
            >
              Huỷ
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleReject}
              disabled={pending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {pending ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
