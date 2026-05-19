'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  cancelStaffInviteAction,
  removeStaffAction,
} from '@/app/actions/staff';
import { useToast } from '@/components/ui/toast';

interface Props {
  kind: 'staff' | 'invite';
  id: string;
  name: string;
}

export function StaffRowActions({ kind, id, name }: Props) {
  const { show } = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onDelete() {
    const message =
      kind === 'staff' ? `Xoá ${name} khỏi team?` : `Huỷ lời mời ${name}?`;
    if (!confirm(message)) return;

    startTransition(async () => {
      const r =
        kind === 'staff'
          ? await removeStaffAction(id)
          : await cancelStaffInviteAction(id);
      if (!r.ok) {
        show(r.error || 'Có lỗi xảy ra', 'error');
        return;
      }
      show(
        kind === 'staff' ? `✓ Đã xoá ${name}` : `✓ Đã huỷ lời mời`,
        'success',
      );
      router.refresh();
    });
  }

  return (
    <button
      onClick={onDelete}
      disabled={pending}
      type="button"
      className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
    >
      {pending ? '...' : kind === 'staff' ? 'Xoá' : 'Huỷ'}
    </button>
  );
}
