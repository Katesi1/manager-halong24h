import type { Metadata } from 'next';

import { HostDashboardClient } from '@/components/host/host-dashboard-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Tổng quan' };

export default function HostDashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Tổng quan"
        description="Xin chào! Đây là bức tranh kinh doanh hôm nay."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/host/dashboard → hiện endpoint trong Network */}
      <HostDashboardClient />
    </div>
  );
}
