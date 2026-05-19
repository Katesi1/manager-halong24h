'use client';

import { useActionState, useEffect, useTransition, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  approvePropertyAction,
  rejectPropertyAction,
  suspendPropertyAction,
  type AdminActionResult,
} from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

interface Props {
  propertyId: string;
  status: 'pending' | 'active' | 'rejected' | 'suspended';
}

export function ApprovalActions({ propertyId, status }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const rejectAction = rejectPropertyAction.bind(null, propertyId);
  const [rejectState, rejectFormAction] = useActionState<AdminActionResult, FormData>(
    rejectAction,
    {},
  );

  function approve() {
    start(async () => {
      const r = await approvePropertyAction(propertyId);
      if (r && r.error) {
        toast.error('Duyệt thất bại: ' + r.error);
      } else {
        toast.success('Đã duyệt cơ sở');
      }
      router.refresh();
    });
  }

  function suspend(s: boolean) {
    start(async () => {
      const r = await suspendPropertyAction(propertyId, s);
      if (r && r.error) {
        toast.error('Thao tác thất bại: ' + r.error);
      } else {
        toast.success(s ? 'Đã tạm khóa cơ sở' : 'Đã mở khóa cơ sở');
      }
      router.refresh();
    });
  }

  // Surface reject form-action result as toast
  useEffect(() => {
    if (rejectState.ok) {
      toast.success('Đã từ chối cơ sở');
      setShowReject(false);
    } else if (rejectState.error) {
      toast.error('Từ chối thất bại: ' + rejectState.error);
    }
  }, [rejectState]);

  if (status === 'pending') {
    return (
      <div className="space-y-3">
        <Button onClick={approve} disabled={pending} variant="primary" className="w-full">
          ✓ Duyệt cơ sở
        </Button>
        {!showReject ? (
          <Button
            variant="outline"
            onClick={() => setShowReject(true)}
            disabled={pending}
            className="w-full"
          >
            ✗ Từ chối
          </Button>
        ) : (
          <form action={rejectFormAction} className="space-y-2">
            <Textarea
              name="reason"
              required
              minLength={5}
              rows={3}
              placeholder="Lý do từ chối (gửi cho chủ nhà)..."
            />
            {rejectState.error && (
              <p className="text-xs text-red-600">{rejectState.error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" variant="danger" disabled={pending} className="flex-1">
                Xác nhận từ chối
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowReject(false)}
                disabled={pending}
              >
                Hủy
              </Button>
            </div>
          </form>
        )}
      </div>
    );
  }

  if (status === 'active') {
    return (
      <Button
        variant="danger"
        onClick={() => suspend(true)}
        disabled={pending}
        className="w-full"
      >
        🔒 Tạm khóa cơ sở
      </Button>
    );
  }

  if (status === 'suspended') {
    return (
      <Button onClick={() => suspend(false)} disabled={pending} className="w-full">
        🔓 Mở khóa cơ sở
      </Button>
    );
  }

  if (status === 'rejected') {
    return (
      <Button onClick={approve} disabled={pending} variant="primary" className="w-full">
        ✓ Duyệt lại (revert reject)
      </Button>
    );
  }

  return null;
}
