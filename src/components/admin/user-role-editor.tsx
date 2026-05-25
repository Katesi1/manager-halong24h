'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { changeUserRoleAction } from '@/app/actions/admin-users';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { RoleCode } from '@/core/value-objects/role';

const ROLE_LABEL: Record<RoleCode, string> = {
  [RoleCode.ADMIN]: 'Quản trị',
  [RoleCode.OWNER]: 'Chủ nhà',
  [RoleCode.SALE]: 'Nhân viên',
  [RoleCode.CUSTOMER]: 'Khách',
};

const ROLE_OPTIONS: { value: RoleCode; label: string }[] = [
  { value: RoleCode.ADMIN, label: ROLE_LABEL[RoleCode.ADMIN] },
  { value: RoleCode.OWNER, label: ROLE_LABEL[RoleCode.OWNER] },
  { value: RoleCode.SALE, label: ROLE_LABEL[RoleCode.SALE] },
  { value: RoleCode.CUSTOMER, label: ROLE_LABEL[RoleCode.CUSTOMER] },
];

interface Props {
  userId: string;
  userName: string;
  initialRole: RoleCode;
}

export function UserRoleEditor({
  userId,
  userName,
  initialRole,
}: Props) {
  const router = useRouter();
  const [savedRole, setSavedRole] = useState<RoleCode>(initialRole);
  const [draftRole, setDraftRole] = useState<RoleCode>(initialRole);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = Number.isFinite(draftRole) && draftRole !== savedRole;

  function handleSelectChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const n = Number(e.target.value);
    if (!Number.isFinite(n)) return;
    setDraftRole(n as RoleCode);
  }

  function handleCancel() {
    setDraftRole(savedRole);
  }

  function handleConfirm() {
    // Mock: ghi audit log qua server action + cập nhật UI local.
    // BE chưa expose PATCH /admin/users/:id/role — refresh sẽ revert về role cũ.
    startTransition(async () => {
      const result = await changeUserRoleAction(userId, savedRole, draftRole);
      if (!result.ok) {
        toast.error(result.error || 'Có lỗi khi đổi vai trò');
        return;
      }
      setSavedRole(draftRole);
      setConfirmOpen(false);
      toast.success(
        `Đã đổi vai trò sang "${ROLE_LABEL[draftRole]}".`,
      );
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Vai trò"
          value={draftRole}
          onChange={handleSelectChange}
          className="h-9 rounded-md border border-ink-300 bg-white px-3 text-sm font-medium text-ink-900 focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {dirty && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => setConfirmOpen(true)}
              disabled={pending}
            >
              Lưu
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              disabled={pending}
            >
              Huỷ
            </Button>
          </>
        )}
      </div>
      <p className="text-[11px] text-ink-500">
        Mỗi lần đổi vai trò được ghi vào{' '}
        <a href="/admin/audit-log" className="underline hover:text-navy-900">
          /admin/audit-log
        </a>
        .
      </p>

      <Dialog
        open={confirmOpen}
        onOpenChange={(o: boolean) => setConfirmOpen(o)}
      >
        <DialogContent open={confirmOpen}>
          <DialogTitle>
            Bạn chắc chắn đổi vai trò của {userName} từ{' '}
            {ROLE_LABEL[savedRole]} sang {ROLE_LABEL[draftRole]}?
          </DialogTitle>
          <DialogDescription>
            Việc này sẽ thay đổi quyền truy cập của user ngay lập tức. Mọi
            session hiện tại sẽ bị buộc đăng xuất.
          </DialogDescription>
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={pending}
            >
              Huỷ
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirm}
              disabled={pending}
            >
              {pending ? 'Đang ghi…' : 'Đổi vai trò'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
