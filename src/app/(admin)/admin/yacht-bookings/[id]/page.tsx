import { YachtBookingDetailClient } from '@/components/admin/yacht-booking-detail-client';
import { PageHeader } from '@/components/host/page-header';

export default async function YachtBookingDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Chi tiết đơn"
        description="Luồng: xác nhận → gửi VietQR cho khách → ghi nhận thanh toán → hệ thống gửi email mã code."
        backHref="/admin/yacht-bookings"
        backLabel="Danh sách đơn"
        breadcrumbs={[
          { label: 'Đơn du thuyền', href: '/admin/yacht-bookings' },
          { label: 'Chi tiết' },
        ]}
      />
      <YachtBookingDetailClient id={id} />
    </div>
  );
}
