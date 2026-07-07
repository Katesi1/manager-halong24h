import type { Metadata } from 'next';

import { HostBillingClient } from '@/components/host/host-billing-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Gói cước' };

export default function HostBillingPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Gói cước"
        description="Chọn gói phù hợp với quy mô cơ sở của bạn."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/host/billing → hiện endpoint trong Network */}
      <HostBillingClient />
    </div>
  );
}
