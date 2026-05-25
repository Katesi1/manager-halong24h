import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { GuardBanner } from '@/components/host/guard-banner';
import { PageHeader } from '@/components/host/page-header';
import { PropertyWizard } from '@/components/host/property-wizard';
import { RoleCode } from '@/core/value-objects/role';
import { blockedReason } from '@/lib/subscription-guard';

export const metadata: Metadata = { title: 'Thêm cơ sở' };

export default async function NewPropertyPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null; // layout đã redirect

  // SALE không được tạo property
  if (profile.role === RoleCode.SALE) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <GuardBanner
          icon="🚫"
          title="Nhân viên SALE không có quyền tạo cơ sở"
          description="Chỉ chủ nhà (OWNER) được tạo cơ sở mới. Vui lòng liên hệ chủ nhà của bạn để tạo cơ sở."
          ctaLabel="Về trang quản lý"
          ctaHref="/host"
        />
      </div>
    );
  }

  // OWNER chưa KYC approved + không bypass → block
  if (
    profile.role === RoleCode.OWNER &&
    profile.kycStatus !== 'approved' &&
    !profile.kycBypass
  ) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <GuardBanner
          icon="🛡️"
          title="Cần hoàn tất KYC trước khi tạo cơ sở"
          description="Theo chính sách Halong24h, chủ nhà phải xác minh đầy đủ 7 yếu tố (GPKD/HKD + CCCD + selfie + STK + VNeID + SĐT + Gmail) trên app mobile trước khi đăng cơ sở để bảo vệ khách."
          ctaLabel="Mở cài đặt KYC"
          ctaHref="/host/settings"
          secondaryLabel="Về tổng quan"
          secondaryHref="/host"
        />
      </div>
    );
  }

  // Subscription overdue/frozen → block
  const subResult = await getMySubscriptionAction();
  const subBlock = subResult.ok ? blockedReason(subResult.data) : null;
  if (subBlock) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Thêm cơ sở mới"
        description="Điền 4 bước thông tin. Sau khi tạo bạn có thể thêm ảnh + chỉnh giá chi tiết."
        breadcrumbs={[
          { label: 'Cơ sở', href: '/host/properties' },
          { label: 'Thêm mới' },
        ]}
      />
      <PropertyWizard />
      <div className="mt-6 text-sm text-ink-500">
        <Link href="/host/properties" className="hover:underline">
          ← Hủy, quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
