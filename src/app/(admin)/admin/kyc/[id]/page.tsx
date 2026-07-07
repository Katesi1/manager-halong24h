import type { Metadata } from 'next';

import { AdminKycDetailClient } from '@/components/admin/admin-kyc-detail-client';

export const metadata: Metadata = { title: 'Chi tiết KYC' };

export default async function AdminKycDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/kyc/:id → hiện endpoint trong Network */}
      <AdminKycDetailClient id={id} />
    </div>
  );
}
