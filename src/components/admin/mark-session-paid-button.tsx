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
  const [reference, setReference] = useState('');
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const res = await markPaymentSessionPaidAction({
        sessionId,
        reference: reference.trim() || undefined,
      });
      if (res.ok) {
        toast.success('Đã xác nhận thanh toán');
        setOpen(false);
        setReference('');
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <>
      <Button
        size="sm"
        variant="primary"
        onClick={() => setOpen(true)}
      >
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
            Đối chiếu với app banking ACB. Sau khi xác nhận, BE sẽ activate
            subscription cho user ngay.
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

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label
                htmlFor="reference"
                className="block text-xs font-medium text-ink-700"
              >
                Mã giao dịch banking (optional)
              </label>
              <input
                id="reference"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="VD: FT26060512345678"
                disabled={pending}
                maxLength={64}
                className="mt-1 h-10 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm focus:border-navy-500 focus:outline-none focus:ring-2 focus:ring-navy-500/20 disabled:bg-cream-100 font-mono"
              />
              <p className="mt-1 text-[10px] text-ink-500">
                Copy từ app banking để có audit trail.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                type="submit"
                variant="primary"
                size="sm"
                disabled={pending}
              >
                {pending ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
