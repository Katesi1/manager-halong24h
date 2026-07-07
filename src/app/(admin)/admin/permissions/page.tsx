import type { Metadata } from 'next';

import { AdminPermissionsClient } from '@/components/admin/admin-permissions-client';

export const metadata: Metadata = { title: 'Phân quyền' };

export default async function AdminPermissionsPage(props: {
  searchParams: Promise<{ userId?: string }>;
}) {
  const { userId } = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/permissions → hiện endpoint trong Network */}
      <AdminPermissionsClient userId={userId} />
    </div>
  );
}
