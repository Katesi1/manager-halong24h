'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface Props {
  open: boolean;
  title: string;
  description?: string;
  /** Label cho nút confirm (mặc định: "Xác nhận"). */
  confirmLabel?: string;
  /** Label cho nút huỷ (mặc định: "Huỷ"). */
  cancelLabel?: string;
  /** Variant cho nút confirm. `danger` cho hành động không reversible (mặc định). */
  variant?: 'danger' | 'primary';
  /** Trạng thái pending — disable cả 2 nút. */
  pending?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Huỷ',
  variant = 'danger',
  pending = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && !pending && onCancel()}>
      <DialogContent open={open}>
        <h3 className="font-display text-lg font-semibold text-ink-900">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-ink-600 whitespace-pre-wrap">
            {description}
          </p>
        )}
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'primary' : 'gold'}
            size="sm"
            onClick={() => void onConfirm()}
            disabled={pending}
            className={
              variant === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : undefined
            }
          >
            {pending ? '...' : confirmLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
