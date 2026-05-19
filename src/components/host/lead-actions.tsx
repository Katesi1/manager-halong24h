'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLeadStatusAction } from '@/app/actions/lead';
import { Button } from '@/components/ui/button';

interface LeadActionsProps {
  leadId: string;
  currentStatus: 'new' | 'contacted' | 'converted' | 'rejected' | 'expired';
}

export function LeadActions({ leadId, currentStatus }: LeadActionsProps) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function update(status: 'contacted' | 'rejected') {
    start(async () => {
      await updateLeadStatusAction(leadId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === 'new' && (
        <>
          <Button onClick={() => update('contacted')} disabled={pending}>
            {pending ? '...' : '✓ Đánh dấu đã liên hệ'}
          </Button>
          <Button variant="outline" onClick={() => update('rejected')} disabled={pending}>
            ✗ Từ chối
          </Button>
        </>
      )}
      {currentStatus === 'contacted' && (
        <Button variant="outline" disabled>
          Đã liên hệ — chờ chốt booking
        </Button>
      )}
    </div>
  );
}
