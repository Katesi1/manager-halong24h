'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { markPaymentSessionPaidAction } from '@/app/actions/payment-sessions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatVND } from '@/lib/format';

interface Props {
  sessionId: string;
  ckContent: string;
  amount: number;
}

export function MarkSessionPaidButton({
  sessionId,
  ckContent,
  amount,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmPaid() {
    startTransition(async () => {
      const res = await markPaymentSessionPaidAction({ sessionId });
      if (res.ok) {
        toast.success('Đã xác nhận nhận tiền — gói cước được kích hoạt');
        setOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
        Đã nhận tiền
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => !o && !pending && setOpen(false)}
      >
        <DialogContent open={open}>
          <h3 className="font-display text-lg font-semibold text-ink-900">
            Xác nhận đã nhận tiền
          </h3>
          <p className="mt-1 text-sm text-ink-600">
            Chỉ xác nhận sau khi đã thấy giao dịch khớp trong app banking ACB.
            Sau khi xác nhận, gói cước của chủ nhà sẽ được kích hoạt ngay.
          </p>

          <dl className="mt-4 space-y-2 rounded-lg bg-cream-100 p-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-500">Số tiền:</dt>
              <dd className="font-semibold text-ink-900">
                {formatVND(amount)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-500 shrink-0">Nội dung CK:</dt>
              <dd className="font-mono text-xs text-right break-all">
                {ckContent}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Huỷ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={confirmPaid}
              disabled={pending}
            >
              {pending ? 'Đang xử lý...' : 'Đã nhận tiền'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
