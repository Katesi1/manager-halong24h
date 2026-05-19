'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  approveKycAdminAction,
  rejectKycAdminAction,
} from '@/app/actions/kyc-admin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import type { KycSubmissionStatus } from '@/core/entities/kyc';

interface Props {
  submissionId: string;
  status: KycSubmissionStatus;
}

export function KycModerationActions({ submissionId, status }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function onApprove() {
    setError(null);
    startTransition(async () => {
      const r = await approveKycAdminAction(submissionId);
      if (!r.ok) {
        setError(r.error);
        toast.error('Duyệt KYC thất bại: ' + r.error);
      } else {
        toast.success('Đã duyệt hồ sơ KYC');
        setShowApprove(false);
        router.refresh();
      }
    });
  }

  function onReject() {
    if (reason.trim().length < 5) {
      setError('Lý do từ chối tối thiểu 5 ký tự');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await rejectKycAdminAction(submissionId, reason.trim());
      if (!r.ok) {
        setError(r.error);
        toast.error('Từ chối thất bại: ' + r.error);
      } else {
        toast.success('Đã từ chối hồ sơ KYC');
        setShowReject(false);
        setReason('');
        router.refresh();
      }
    });
  }

  const canModerate =
    status === 'awaiting_approval' ||
    status === 'kyc_submitted' ||
    status === 'paid';

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {!canModerate && (
        <p className="rounded-md bg-cream-100 px-3 py-2 text-xs text-ink-600">
          Hồ sơ ở trạng thái này không cần duyệt thêm.
        </p>
      )}

      {canModerate && !showApprove && !showReject && (
        <>
          <Button
            variant="primary"
            onClick={() => setShowApprove(true)}
            disabled={pending}
            className="w-full"
          >
            ✓ Duyệt hồ sơ
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="w-full"
          >
            ✕ Từ chối
          </Button>
        </>
      )}

      {showApprove && (
        <div className="space-y-2 rounded-lg bg-emerald-50 p-3 ring-1 ring-emerald-200">
          <p className="text-xs text-emerald-900">
            Xác nhận: 7 yếu tố đã trùng khớp. Chủ nhà sẽ được phép tạo cơ sở và nhận booking.
          </p>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={onApprove}
              disabled={pending}
              className="flex-1"
            >
              {pending ? 'Đang duyệt...' : 'Xác nhận duyệt'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowApprove(false)}
              disabled={pending}
            >
              Quay lại
            </Button>
          </div>
        </div>
      )}

      {showReject && (
        <div className="space-y-2 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-200">
          <p className="text-xs text-rose-900">
            Nhập lý do cụ thể (sẽ gửi cho chủ nhà, họ phải nộp lại):
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="VD: STK ngân hàng không khớp tên CCCD, vui lòng cung cấp STK chính chủ"
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={onReject}
              disabled={pending}
              className="flex-1"
            >
              {pending ? 'Đang gửi...' : 'Xác nhận từ chối'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowReject(false);
                setReason('');
                setError(null);
              }}
              disabled={pending}
            >
              Quay lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
