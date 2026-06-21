'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { suspendPropertyAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

interface Props {
  propertyId: string;
  /**
   * Không còn luồng "duyệt": OWNER đã KYC tạo phòng là active ngay.
   * Admin chỉ tạm khoá (active) hoặc mở khoá (suspended).
   */
  status: 'active' | 'suspended';
}

export function ApprovalActions({ propertyId, status }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

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

  return (
    <Button onClick={() => suspend(false)} disabled={pending} className="w-full">
      🔓 Mở khóa cơ sở
    </Button>
  );
}
