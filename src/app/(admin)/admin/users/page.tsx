import type { Metadata } from 'next';

import { AdminUsersClient } from '@/components/admin/admin-users-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Người dùng' };

export default async function AdminUsersPage(props: {
  searchParams: Promise<{
    role?: string;
    q?: string;
    status?: string;
  }>;
}) {
  const sp = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Người dùng"
        description="Quản lý tất cả tài khoản: Khách, Chủ nhà, Nhân viên SALE, Quản trị viên. Tìm kiếm, lọc, chặn, drill-down xem hoạt động."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/users → hiện endpoint trong Network */}
      <AdminUsersClient role={sp.role} status={sp.status} q={sp.q?.trim() || undefined} />
    </div>
  );
}
