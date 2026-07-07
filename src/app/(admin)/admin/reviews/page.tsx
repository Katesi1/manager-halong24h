import type { Metadata } from 'next';

import { AdminReviewsClient } from '@/components/admin/admin-reviews-client';

export const metadata: Metadata = { title: 'Quản lý đánh giá' };

export default async function AdminReviewsPage(props: {
  searchParams: Promise<{ status?: string; flagged?: string; q?: string }>;
}) {
  const sp = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/reviews → hiện endpoint trong Network */}
      <AdminReviewsClient
        status={sp.status}
        flagged={sp.flagged === '1'}
        q={sp.q?.trim() || undefined}
      />
    </div>
  );
}
