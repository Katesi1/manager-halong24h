import { YachtBookingsClient } from '@/components/admin/yacht-bookings-client';
import { PageHeader } from '@/components/host/page-header';
import type { YachtBookingStatus } from '@/core/entities/yacht-booking';
import { isYachtBookingStatus } from '@/lib/yacht-display';

export default async function AdminYachtBookingsPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const status: YachtBookingStatus | undefined =
    sp.status && isYachtBookingStatus(sp.status) ? sp.status : undefined;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Đơn đặt du thuyền"
        description="Xác nhận đơn (tạo VietQR gửi khách), ghi nhận thanh toán, huỷ đơn."
      />
      <YachtBookingsClient status={status} />
    </div>
  );
}
