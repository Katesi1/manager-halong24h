import type { Metadata } from 'next';

import { AdminDisputesClient } from '@/components/admin/admin-disputes-client';
import type { DisputeStatus } from '@/core/entities/dispute';

export const metadata: Metadata = { title: 'Khiếu nại' };

function isStatus(s?: string): s is DisputeStatus {
  return (
    s === 'open' ||
    s === 'investigating' ||
    s === 'resolved' ||
    s === 'rejected'
  );
}

export default async function AdminDisputesPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const status = isStatus(sp.status) ? sp.status : undefined;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/disputes → hiện endpoint trong Network */}
      <AdminDisputesClient status={status} />
    </div>
  );
}
