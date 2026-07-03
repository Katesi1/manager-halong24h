'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Flame } from 'lucide-react';

import { setPropertyHotAction } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/toast';

interface Props {
  propertyId: string;
  isHot: boolean;
}

/**
 * Toggle badge "Hot" (admin curated — spec §4.10).
 * Hot property nổi đầu khi sort=featured và lọc được bằng ?hot=true.
 */
export function HotToggle({ propertyId, isHot }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function toggle() {
    start(async () => {
      const r = await setPropertyHotAction(propertyId, !isHot);
      if (r?.error) {
        toast.error('Thao tác thất bại: ' + r.error);
        return;
      }
      toast.success(isHot ? 'Đã bỏ đánh dấu Hot' : 'Đã đánh dấu Hot');
      router.refresh();
    });
  }

  return (
    <Button
      variant={isHot ? 'gold' : 'outline'}
      onClick={toggle}
      disabled={pending}
      className="w-full"
    >
      <Flame className="mr-1.5 h-4 w-4" />
      {isHot ? 'Đang Hot — bấm để tắt' : 'Đánh dấu Hot'}
    </Button>
  );
}
