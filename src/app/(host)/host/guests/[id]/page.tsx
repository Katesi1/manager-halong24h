import { GuestDetailClient } from '@/components/host/guest-detail-client';
import { PageHeader } from '@/components/host/page-header';

export default async function GuestDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Hồ sơ khách hàng"
        description="Thông tin liên hệ, nhãn nội bộ và lịch sử đặt phòng gần đây."
        backHref="/host/guests"
        backLabel="Danh sách khách"
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/guests/:id → hiện endpoint trong Network */}
      <GuestDetailClient id={id} />
    </div>
  );
}
