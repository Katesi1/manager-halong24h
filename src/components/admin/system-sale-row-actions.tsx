'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';

import { deleteSystemSaleAction } from '@/app/actions/system-staff';
import { SystemSaleEditDialog } from '@/components/admin/system-sale-dialogs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';

/** Hành động trên 1 row System SALE: sửa + xoá (`DELETE /users/:id`). */
export function SystemSaleRowActions({
  sale,
}: {
  sale: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    isActive: boolean;
  };
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  function remove() {
    startTransition(async () => {
      const res = await deleteSystemSaleAction(sale.id);
      if (!res.ok) {
        toast.error(res.error || 'Không xoá được tài khoản');
        return;
      }
      toast.success(`Đã xoá tài khoản ${sale.name}`);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-3">
      <SystemSaleEditDialog sale={sale} />
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-rose-600 hover:underline"
      >
        <Trash2 className="h-3.5 w-3.5" />
        Xoá
      </button>
      <ConfirmDialog
        open={confirming}
        title={`Xoá tài khoản ${sale.name}?`}
        description={`Tài khoản ${sale.email} sẽ bị xoá khỏi hệ thống và không đăng nhập được nữa. Hành động này không thể hoàn tác.`}
        confirmLabel="Xoá tài khoản"
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
