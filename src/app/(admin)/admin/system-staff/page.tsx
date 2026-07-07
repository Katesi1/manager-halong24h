import type { Metadata } from 'next';

import { SystemSaleCreateDialog } from '@/components/admin/system-sale-dialogs';
import { SystemSalesFetchView } from '@/components/admin/system-sales-fetch-view';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Tài khoản Sale hệ thống' };

export default async function AdminSystemStaffPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Quản lý nền tảng"
        title="Tài khoản Sale hệ thống"
        description="Nhân viên Sale trực thuộc Halong24h — thấy dữ liệu toàn hệ thống, quyền cấp theo từng module (chỉ ADMIN quản lý)."
        actions={<SystemSaleCreateDialog />}
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/system-staff → hiện endpoint trong Network */}
      <SystemSalesFetchView initialStatus={status} initialQ={q} />
    </div>
  );
}
