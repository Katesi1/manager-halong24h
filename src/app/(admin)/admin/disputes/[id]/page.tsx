import type { Metadata } from 'next';

import { AdminDisputeDetailClient } from '@/components/admin/admin-dispute-detail-client';

export const metadata: Metadata = { title: 'Chi tiết khiếu nại' };

export default async function AdminDisputeDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/disputes/:id → hiện endpoint trong Network */}
      <AdminDisputeDetailClient id={id} />
    </div>
  );
}
