import type { Metadata } from 'next';

import { AdminDashboardClient } from '@/components/admin/admin-dashboard-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Quản trị' };

export default function AdminOverviewPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Quản trị hệ thống"
        title="Tổng quan hệ thống"
        description="Bức tranh toàn Halong24h — chỉ số vận hành, cảnh báo cần action, tài chính theo subscription chủ nhà."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/dashboard → hiện endpoint trong Network */}
      <AdminDashboardClient />
    </div>
  );
}
