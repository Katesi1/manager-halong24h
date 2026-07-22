'use client';

import { refetchApiResources } from '@/lib/use-api-resource';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
  banAdminUserAction,
  resetUserPasswordAction,
  revokeUserSessionAction,
  unbanAdminUserAction,
} from '@/app/actions/admin-users';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/input';
import { toast, useToast } from '@/components/ui/toast';
import type { AdminUserStatus } from '@/core/entities/admin-user';
import { RoleCode } from '@/core/value-objects/role';

interface Props {
  userId: string;
  role: RoleCode;
  status: AdminUserStatus;
}

const PENDING_DELETION_STORAGE = 'halong24h-pending-deletion';

function readPendingDeletion(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem(PENDING_DELETION_STORAGE);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return Boolean(parsed[userId]);
  } catch {
    return false;
  }
}

function writePendingDeletion(userId: string, value: boolean) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(PENDING_DELETION_STORAGE);
    const parsed = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    if (value) parsed[userId] = true;
    else delete parsed[userId];
    window.localStorage.setItem(
      PENDING_DELETION_STORAGE,
      JSON.stringify(parsed),
    );
  } catch {
    // ignore
  }
}

function hardDeleteDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

export function UserModerationActions({ userId, role, status }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [showBan, setShowBan] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  type Confirm =
    | { kind: 'unban' }
    | { kind: 'revoke' }
    | { kind: 'reset-pwd' };
  const [pendingConfirm, setPendingConfirm] = useState<Confirm | null>(null);

  // Soft-delete (R14)
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteAck, setDeleteAck] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState<boolean>(() =>
    readPendingDeletion(userId),
  );

  // Sync soft-delete state across tabs / on focus return.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function reload() {
      setPendingDeletion(readPendingDeletion(userId));
    }
    function handleStorage(e: StorageEvent) {
      if (e.key === PENDING_DELETION_STORAGE) reload();
    }
    function handleVisibility() {
      if (document.visibilityState === 'visible') reload();
    }
    window.addEventListener('storage', handleStorage);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('storage', handleStorage);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userId]);

  const isOwner = role === RoleCode.OWNER;
  const isSale = role === RoleCode.SALE;

  function onBan() {
    if (reason.trim().length < 5) {
      setError('Lý do tối thiểu 5 ký tự');
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await banAdminUserAction(userId, reason.trim());
      if (!r.ok) {
        show(r.error || 'Có lỗi', 'error');
        return;
      }
      show('✓ Đã chặn người dùng', 'success');
      setShowBan(false);
      setReason('');
      router.refresh();
      refetchApiResources();
    });
  }

  function onUnban() {
    setPendingConfirm({ kind: 'unban' });
  }
  function onRevoke() {
    setPendingConfirm({ kind: 'revoke' });
  }

  function executeConfirm() {
    const c = pendingConfirm;
    if (!c) return;
    setPendingConfirm(null);
    startTransition(async () => {
      if (c.kind === 'unban') {
        const r = await unbanAdminUserAction(userId);
        if (!r.ok) {
          show(r.error || 'Có lỗi', 'error');
          return;
        }
        show('✓ Đã mở chặn', 'success');
        router.refresh();
        refetchApiResources();
      } else if (c.kind === 'revoke') {
        const r = await revokeUserSessionAction(userId);
        if (!r.ok) {
          show(r.error || 'Có lỗi', 'error');
          return;
        }
        show('✓ Đã revoke session', 'success');
      } else if (c.kind === 'reset-pwd') {
        const r = await resetUserPasswordAction(userId);
        if (!r.ok) {
          show(r.error || 'Có lỗi', 'error');
          return;
        }
        show('✓ Đã gửi email reset', 'success');
      }
    });
  }

  function confirmMeta(c: Confirm): { title: string; description: string } {
    switch (c.kind) {
      case 'unban':
        return { title: 'Mở chặn người dùng?', description: 'Người dùng sẽ được khôi phục quyền truy cập ngay.' };
      case 'revoke':
        return {
          title: 'Force logout?',
          description: 'Đá người dùng khỏi mọi phiên đang active. Họ phải đăng nhập lại.',
        };
      case 'reset-pwd':
        return {
          title: 'Gửi email reset mật khẩu?',
          description: 'Người dùng sẽ nhận link đặt lại mật khẩu qua email.',
        };
    }
  }

  function onConfirmSoftDelete() {
    if (!deleteAck || deleteReason.trim().length < 5) return;
    // Mock — không gọi BE.
    writePendingDeletion(userId, true);
    setPendingDeletion(true);
    setDeleteOpen(false);
    setDeleteReason('');
    setDeleteAck(false);
    toast.success(
      `Đã đặt xóa tài khoản. Hard delete sau ${hardDeleteDateString()}.`,
    );
  }

  function onRestoreAccount() {
    writePendingDeletion(userId, false);
    setPendingDeletion(false);
    toast.success('Đã khôi phục tài khoản.');
  }

  function onResetPwd() {
    setPendingConfirm({ kind: 'reset-pwd' });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-100">
          {error}
        </p>
      )}

      {/* Ban / Unban */}
      {status !== 'banned' && !showBan && (
        <Button
          variant="danger"
          onClick={() => setShowBan(true)}
          disabled={pending}
          className="w-full"
        >
          🚫 Chặn người dùng
        </Button>
      )}
      {status === 'banned' && (
        <Button
          variant="primary"
          onClick={onUnban}
          disabled={pending}
          className="w-full"
        >
          ✓ Mở chặn
        </Button>
      )}
      {showBan && (
        <div className="space-y-2 rounded-lg bg-rose-50 p-3 ring-1 ring-rose-200">
          <p className="text-xs text-rose-900">Nhập lý do chặn:</p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="VD: Vi phạm điều khoản, lừa đảo..."
          />
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={onBan}
              disabled={pending}
              className="flex-1"
            >
              {pending ? 'Đang chặn...' : 'Xác nhận chặn'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowBan(false);
                setReason('');
                setError(null);
              }}
            >
              Huỷ
            </Button>
          </div>
        </div>
      )}

      {/* Revoke session */}
      {(isOwner || isSale) && (
        <Button
          variant="outline"
          onClick={onRevoke}
          disabled={pending}
          className="w-full"
        >
          🔓 Buộc đăng xuất tất cả thiết bị
        </Button>
      )}

      {/* Reset password */}
      <Button
        variant="ghost"
        onClick={onResetPwd}
        disabled={pending}
        className="w-full"
      >
        📧 Gửi email reset mật khẩu
      </Button>

      {/* Soft-delete (R14) */}
      <div className="border-t border-ink-200 pt-3">
        {pendingDeletion ? (
          <div className="space-y-2">
            <p className="rounded-md bg-amber-50 px-3 py-2 text-[11px] text-amber-900 ring-1 ring-amber-200">
              Tài khoản đang ở trạng thái <strong>pending deletion</strong>.
              Hard delete dự kiến: <strong>{hardDeleteDateString()}</strong>.
            </p>
            <Button
              variant="outline"
              onClick={onRestoreAccount}
              className="w-full"
            >
              🔄 Khôi phục tài khoản
            </Button>
          </div>
        ) : (
          <Button
            variant="danger"
            onClick={() => setDeleteOpen(true)}
            disabled={pending}
            className="w-full"
          >
            🗑 Xóa tài khoản (30-day grace)
          </Button>
        )}
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o: boolean) => {
          setDeleteOpen(o);
          if (!o) {
            setDeleteReason('');
            setDeleteAck(false);
          }
        }}
      >
        <DialogContent open={deleteOpen} className="max-w-lg">
          <DialogTitle>Xóa tài khoản người dùng?</DialogTitle>
          <DialogDescription>
            <span className="block">
              Tài khoản sẽ vào trạng thái &quot;pending deletion&quot; trong 30
              ngày.
            </span>
            <span className="mt-2 block">
              Sau 30 ngày, dữ liệu cá nhân sẽ bị xóa cứng, chat log được
              anonymize và giữ lại 5 năm (theo Nghị định 13/2023).
            </span>
            <span className="mt-2 block">
              User sẽ nhận email nhắc nhở ở ngày 25. User có thể bấm khôi phục
              qua email trong 30 ngày.
            </span>
          </DialogDescription>
          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-ink-900">
                Lý do xóa (chỉ admin xem) *
              </span>
              <Textarea
                rows={3}
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="VD: User yêu cầu, vi phạm điều khoản…"
              />
            </label>
            <label className="flex items-start gap-2 text-xs text-ink-800">
              <input
                type="checkbox"
                checked={deleteAck}
                onChange={(e) => setDeleteAck(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Tôi xác nhận tuân thủ NĐ 13/2023 về xóa dữ liệu cá nhân
              </span>
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="danger"
              disabled={!deleteAck || deleteReason.trim().length < 5}
              onClick={onConfirmSoftDelete}
            >
              Bắt đầu xóa (30-day grace)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog
        open={pendingConfirm !== null}
        title={pendingConfirm ? confirmMeta(pendingConfirm).title : ''}
        description={
          pendingConfirm ? confirmMeta(pendingConfirm).description : undefined
        }
        confirmLabel={
          pendingConfirm?.kind === 'unban'
            ? 'Mở chặn'
            : pendingConfirm?.kind === 'revoke'
              ? 'Force logout'
              : 'Gửi email'
        }
        variant={
          pendingConfirm?.kind === 'revoke' ? 'danger' : 'primary'
        }
        pending={pending}
        onConfirm={executeConfirm}
        onCancel={() => setPendingConfirm(null)}
      />
    </div>
  );
}
