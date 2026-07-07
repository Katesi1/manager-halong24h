import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';
import { ownerEntitlement } from '@/lib/entitlement';
import type { HostGate } from '@/lib/host-gate';

/**
 * BFF route (host) — cổng chặn tạo cơ sở mới. Enforce role/KYC/entitlement
 * PHÍA SERVER, trả `{ gate }` (null = được phép). Client render banner/wizard.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let gate: HostGate | null = null;

  if (profile.role === RoleCode.SALE) {
    gate = {
      icon: '🚫',
      title: 'Nhân viên SALE không có quyền tạo cơ sở',
      description:
        'Chỉ chủ nhà (OWNER) được tạo cơ sở mới. Vui lòng liên hệ chủ nhà của bạn để tạo cơ sở.',
      ctaLabel: 'Về trang quản lý',
      ctaHref: '/host',
    };
  } else if (
    profile.role === RoleCode.OWNER &&
    profile.kycStatus !== 'approved' &&
    !profile.kycBypass
  ) {
    gate = {
      icon: '🛡️',
      title: 'Cần hoàn tất KYC trước khi tạo cơ sở',
      description:
        'Theo chính sách Halong24h, chủ nhà phải xác minh đầy đủ 7 yếu tố (GPKD/HKD + CCCD + selfie + STK + VNeID + SĐT + Gmail) trên app mobile trước khi đăng cơ sở để bảo vệ khách.',
      ctaLabel: 'Mở cài đặt KYC',
      ctaHref: '/host/settings',
      secondaryLabel: 'Về tổng quan',
      secondaryHref: '/host',
    };
  } else if (profile.role === RoleCode.OWNER) {
    const entitlement = ownerEntitlement(profile);
    if (entitlement.blockReason) {
      gate = {
        icon: '💸',
        title: 'Tài khoản chưa đủ quyền đăng phòng',
        description: entitlement.blockReason,
        ctaLabel: 'Đăng ký gói',
        ctaHref: '/host/settings/subscription',
        secondaryLabel: 'Về tổng quan',
        secondaryHref: '/host',
      };
    }
  }

  return NextResponse.json({ data: { gate } });
}
