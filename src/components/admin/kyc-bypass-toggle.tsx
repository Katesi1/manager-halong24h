'use client';

import { refetchApiResources } from '@/lib/use-api-resource';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldOff } from 'lucide-react';

import { setUserKycBypassAction } from '@/app/actions/admin-users';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

interface Props {
  userId: string;
  kycBypass: boolean;
}

/**
 * Toggle quyền "bỏ qua KYC" cho OWNER (spec §2A.7 — ADMIN-only).
 * bypass=true ⇒ OWNER tạo/sửa phòng mà không cần KYC approved.
 */
export function KycBypassToggle({ userId, kycBypass }: Props) {
  const router = useRouter();
  const { show } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const next = !kycBypass;

  function onConfirm() {
    setConfirmOpen(false);
    startTransition(async () => {
      const r = await setUserKycBypassAction(userId, next);
      if (!r.ok) {
        show(r.error || 'Có lỗi', 'error');
        return;
      }
      show(
        next ? '✓ Đã cấp quyền bỏ qua KYC' : '✓ Đã thu hồi quyền bỏ qua KYC',
        'success',
      );
      router.refresh();
      refetchApiResources();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {kycBypass ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800">
            <ShieldCheck className="h-3.5 w-3.5" />
            Đang được miễn KYC
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
            <ShieldOff className="h-3.5 w-3.5" />
            Phải KYC như thường
          </span>
        )}
      </div>
      <Button
        variant={kycBypass ? 'outline' : 'primary'}
        size="sm"
        disabled={pending}
        onClick={() => setConfirmOpen(true)}
      >
        {kycBypass ? 'Thu hồi miễn KYC' : 'Cho qua KYC (không cần xác minh)'}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title={next ? 'Cấp quyền bỏ qua KYC?' : 'Thu hồi quyền bỏ qua KYC?'}
        description={
          next
            ? 'Chủ nhà sẽ tạo/sửa cơ sở mà KHÔNG cần KYC được duyệt. Chỉ dùng khi đã xác minh danh tính qua kênh khác.'
            : 'Chủ nhà sẽ phải có KYC được duyệt mới tạo/sửa được cơ sở. Cơ sở đang có vẫn giữ nguyên.'
        }
        confirmLabel={next ? 'Cấp quyền' : 'Thu hồi'}
        variant={next ? 'primary' : 'danger'}
        pending={pending}
        onConfirm={onConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
