'use client';

import { refetchApiResources } from '@/lib/use-api-resource';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  approvePropertyAction,
  rejectPropertyAction,
  suspendPropertyAction,
  type AdminActionResult,
} from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import type { ModerationStatus } from '@/core/entities/property';

interface Props {
  propertyId: string;
  status: ModerationStatus;
}

type ModalKind = 'reject' | 'suspend' | null;

const REJECT_MIN = 5;

const textareaClass =
  'mt-3 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20';

export function ApprovalActions({ propertyId, status }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [modal, setModal] = useState<ModalKind>(null);
  const [reason, setReason] = useState('');

  function run(
    fn: () => Promise<AdminActionResult>,
    successMsg: string,
  ) {
    start(async () => {
      const r = await fn();
      if (r?.error) {
        toast.error('Thao tác thất bại: ' + r.error);
        return;
      }
      toast.success(successMsg);
      setModal(null);
      setReason('');
      router.refresh();
      refetchApiResources();
    });
  }

  function openModal(kind: Exclude<ModalKind, null>) {
    setReason('');
    setModal(kind);
  }

  function approve(msg: string) {
    run(() => approvePropertyAction(propertyId), msg);
  }

  function confirmReject() {
    if (reason.trim().length < REJECT_MIN) {
      toast.error(`Lý do từ chối phải có ít nhất ${REJECT_MIN} ký tự`);
      return;
    }
    run(() => rejectPropertyAction(propertyId, reason.trim()), 'Đã từ chối cơ sở');
  }

  function confirmSuspend() {
    const trimmed = reason.trim();
    run(
      () => suspendPropertyAction(propertyId, trimmed || undefined),
      'Đã tạm ngưng cơ sở',
    );
  }

  return (
    <div className="space-y-2">
      {status === 'pending' && (
        <>
          <Button
            onClick={() => approve('Đã duyệt cơ sở')}
            disabled={pending}
            className="w-full"
          >
            ✅ Duyệt cơ sở
          </Button>
          <Button
            variant="danger"
            onClick={() => openModal('reject')}
            disabled={pending}
            className="w-full"
          >
            ❌ Từ chối
          </Button>
        </>
      )}

      {status === 'approved' && (
        <Button
          variant="danger"
          onClick={() => openModal('suspend')}
          disabled={pending}
          className="w-full"
        >
          ⏸ Tạm ngưng cơ sở
        </Button>
      )}

      {status === 'rejected' && (
        <Button
          onClick={() => approve('Đã duyệt lại cơ sở')}
          disabled={pending}
          className="w-full"
        >
          ✅ Duyệt lại
        </Button>
      )}

      {status === 'suspended' && (
        <Button
          onClick={() => approve('Đã mở lại cơ sở')}
          disabled={pending}
          className="w-full"
        >
          🔓 Mở lại cơ sở
        </Button>
      )}

      {/* Modal từ chối — bắt buộc lý do */}
      <Dialog
        open={modal === 'reject'}
        onOpenChange={(o) => !o && !pending && setModal(null)}
      >
        <DialogContent open={modal === 'reject'}>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Từ chối cơ sở
          </h3>
          <p className="mt-2 text-sm text-ink-600">
            Nhập lý do từ chối (ít nhất {REJECT_MIN} ký tự). Lý do sẽ hiển thị cho
            chủ cơ sở để họ chỉnh sửa.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="VD: Ảnh cơ sở mờ, thiếu thông tin giá, mô tả không phù hợp…"
            className={textareaClass}
          />
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModal(null)}
              disabled={pending}
            >
              Huỷ
            </Button>
            <Button
              size="sm"
              onClick={confirmReject}
              disabled={pending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {pending ? '...' : 'Xác nhận từ chối'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal tạm ngưng — lý do tuỳ chọn */}
      <Dialog
        open={modal === 'suspend'}
        onOpenChange={(o) => !o && !pending && setModal(null)}
      >
        <DialogContent open={modal === 'suspend'}>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Tạm ngưng cơ sở
          </h3>
          <p className="mt-2 text-sm text-ink-600">
            Cơ sở sẽ bị ẩn khỏi trang khách và chủ không tự bật lại được. Lý do
            (không bắt buộc).
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="VD: Vi phạm quy định, nhiều khiếu nại chưa xử lý…"
            className={textareaClass}
          />
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setModal(null)}
              disabled={pending}
            >
              Huỷ
            </Button>
            <Button
              size="sm"
              onClick={confirmSuspend}
              disabled={pending}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {pending ? '...' : 'Xác nhận tạm ngưng'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
