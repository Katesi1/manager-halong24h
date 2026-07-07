import type { Metadata } from 'next';

import { AdminPropertyDetailClient } from '@/components/admin/admin-property-detail-client';

export const metadata: Metadata = { title: 'Chi tiết cơ sở' };

export default async function AdminPropertyDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/properties/:id → hiện endpoint trong Network */}
      <AdminPropertyDetailClient id={id} />
    </div>
  );
}
