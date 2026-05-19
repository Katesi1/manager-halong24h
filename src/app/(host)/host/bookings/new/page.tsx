import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { listPropertiesAction } from '@/app/actions/properties';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { BookingHoldForm } from '@/components/host/booking-hold-form';
import { GuardBanner } from '@/components/host/guard-banner';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import { RoleCode } from '@/core/value-objects/role';
import { blockedReason } from '@/lib/subscription-guard';

interface SearchParams {
  propertyId?: string;
  checkIn?: string;
  checkOut?: string;
}

export default async function NewBookingPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await props.searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;

  // GUARD: SALE chưa được gán Owner → block
  if (profile.role === RoleCode.SALE && !profile.ownerId) {
    return (
      <div className="p-6 lg:p-8">
        <GuardBanner
          icon="⏳"
          title="Tài khoản SALE chưa được gán Chủ nhà"
          description="Bạn cần được Owner chấp nhận lời mời trước khi tạo đặt phòng. Hãy liên hệ Admin hoặc Owner đã mời bạn để được kích hoạt."
          ctaLabel="Về trang quản lý"
          ctaHref="/host"
        />
      </div>
    );
  }

  // GUARD: OWNER chưa KYC approved + không bypass → block
  if (
    profile.role === RoleCode.OWNER &&
    profile.kycStatus !== 'approved' &&
    !profile.kycBypass
  ) {
    return (
      <div className="p-6 lg:p-8">
        <GuardBanner
          icon="🛡️"
          title="Cần KYC trước khi tạo đặt phòng"
          description="Chủ nhà phải hoàn tất xác minh KYC trên app mobile trước khi bắt đầu nhận khách."
          ctaLabel="Mở cài đặt KYC"
          ctaHref="/host/settings"
          secondaryLabel="Về tổng quan"
          secondaryHref="/host"
        />
      </div>
    );
  }

  // GUARD: Subscription overdue/frozen → block
  const subResult = await getMySubscriptionAction();
  const subBlock = subResult.ok ? blockedReason(subResult.data) : null;
  if (subBlock) {
    return (
      <div className="p-6 lg:p-8">
        <GuardBanner
          icon="💸"
          title="Gói cước cần được kích hoạt"
          description={subBlock}
          ctaLabel="Xem & thanh toán"
          ctaHref="/host/settings/subscription"
          secondaryLabel="Về tổng quan"
          secondaryHref="/host"
        />
      </div>
    );
  }

  const result = await listPropertiesAction({ includeInactive: false });
  const properties = result.ok
    ? result.data.map((p) => ({
        id: p.id,
        name: p.name,
        standardGuests: p.standardGuests,
        maxGuests: p.maxGuests,
      }))
    : [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Tạo đặt phòng mới"
        description="Khách đến trực tiếp, đặt qua điện thoại, hoặc nhập từ kênh khác. Đặt phòng ở trạng thái giữ chỗ 30 phút — sau đó xác nhận để chốt."
        breadcrumbs={[
          { label: 'Đặt phòng', href: '/host/bookings' },
          { label: 'Tạo mới' },
        ]}
      />

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">🏡</p>
          <p className="mt-3 text-ink-700 font-medium">
            Bạn chưa có cơ sở nào hoặc API không kết nối được.
          </p>
          <p className="mt-1 text-sm text-ink-500">
            Tạo cơ sở trước khi tạo đặt phòng.
          </p>
          <Link href="/host/properties/new" className="mt-5 inline-block">
            <Button>+ Thêm cơ sở</Button>
          </Link>
        </div>
      ) : (
        <BookingHoldForm
          properties={properties}
          defaults={{
            propertyId: sp.propertyId,
            checkInAt: sp.checkIn,
            checkOutAt: sp.checkOut,
          }}
        />
      )}
    </div>
  );
}
