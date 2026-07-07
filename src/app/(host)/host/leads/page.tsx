import Link from 'next/link';
import { Lightbulb } from 'lucide-react';

import { LeadsListClient } from '@/components/host/leads-list-client';
import { PageHeader } from '@/components/host/page-header';
import type { LeadStatus } from '@/core/entities/lead';

function isLeadStatus(v: string | undefined): v is LeadStatus {
  return (
    v === 'new' ||
    v === 'contacted' ||
    v === 'converted' ||
    v === 'rejected' ||
    v === 'expired'
  );
}

export default async function LeadsListPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isLeadStatus(sp.status) ? sp.status : undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Yêu cầu"
        description="Khách gửi qua form liên hệ. Phản hồi nhanh < 30ph để giữ Trust Score và lên Top tìm kiếm."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/leads → hiện endpoint trong Network */}
      <LeadsListClient status={status} />

      <div className="mt-6 flex gap-3 rounded-xl border border-gold-200 bg-gold-50 p-4 text-sm text-gold-900">
        <Lightbulb className="h-5 w-5 shrink-0 text-gold-700" />
        <div>
          <span className="font-semibold">Mẹo:</span> Phản hồi yêu cầu trong 30
          phút để giữ Trust Score &gt; 90% và{' '}
          <Link href="/host/resources" className="underline font-medium">
            lên Top tìm kiếm
          </Link>
          .
        </div>
      </div>
    </div>
  );
}
