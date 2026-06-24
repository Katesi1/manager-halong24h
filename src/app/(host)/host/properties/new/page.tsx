import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { GuardBanner } from '@/components/host/guard-banner';
import { PageHeader } from '@/components/host/page-header';
import { PropertyWizard } from '@/components/host/property-wizard';
import { RoleCode } from '@/core/value-objects/role';
import { ownerEntitlement } from '@/lib/entitlement';

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

  // v1.12 entitlement (§2A.5) — hết trial / chưa đủ quyền → block.
  // Nguồn tin cậy: profile (`GET /auth/profile`), không phụ thuộc sub repo.
  if (profile.role === RoleCode.OWNER) {
    const entitlement = ownerEntitlement(profile);
    if (entitlement.blockReason) {
      return (
        <div className="p-4 sm:p-6 lg:p-8">
          <GuardBanner
            icon="💸"
            title="Tài khoản chưa đủ quyền đăng phòng"
            description={entitlement.blockReason}
            ctaLabel="Đăng ký gói"
            ctaHref="/host/settings/subscription"
            secondaryLabel="Về tổng quan"
            secondaryHref="/host"
          />
        </div>
      );
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        backHref="/host/properties"
        backLabel="Quay lại danh sách cơ sở"
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
