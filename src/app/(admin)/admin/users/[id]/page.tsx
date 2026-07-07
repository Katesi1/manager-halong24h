import type { Metadata } from 'next';

import { AdminUserDetailClient } from '@/components/admin/admin-user-detail-client';

export const metadata: Metadata = { title: 'Chi tiết người dùng' };

export default async function AdminUserDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/users/:id → hiện endpoint trong Network */}
      <AdminUserDetailClient id={id} />
    </div>
  );
}
