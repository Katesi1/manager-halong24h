import { HostReviewsClient } from '@/components/host/host-reviews-client';

export default function HostReviewsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT qua /api/host/reviews → hiện trong Network */}
      <HostReviewsClient />
    </div>
  );
}
