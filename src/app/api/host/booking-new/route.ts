import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listPropertiesAction } from '@/app/actions/properties';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';
import type { HostGate } from '@/lib/host-gate';
import { blockedReason } from '@/lib/subscription-guard';

interface PropertyOption {
  id: string;
  name: string;
  standardGuests: number | null;
  maxGuests: number | null;
}

/**
 * BFF route (host) — trang tạo đặt phòng: enforce guard (SALE/KYC/gói cước)
 * PHÍA SERVER + trả danh sách cơ sở. Client render banner hoặc form.
 */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  let gate: HostGate | null = null;

  if (profile.role === RoleCode.SALE && !profile.ownerId) {
    gate = {
      icon: '⏳',
      title: 'Tài khoản SALE chưa được gán Chủ nhà',
      description:
        'Bạn cần được Owner chấp nhận lời mời trước khi tạo đặt phòng. Hãy liên hệ Admin hoặc Owner đã mời bạn để được kích hoạt.',
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
      title: 'Cần KYC trước khi tạo đặt phòng',
      description:
        'Chủ nhà phải hoàn tất xác minh KYC trên app mobile trước khi bắt đầu nhận khách.',
      ctaLabel: 'Mở cài đặt KYC',
      ctaHref: '/host/settings',
      secondaryLabel: 'Về tổng quan',
      secondaryHref: '/host',
    };
  }

  if (!gate) {
    const subResult = await getMySubscriptionAction();
    const subBlock = subResult.ok ? blockedReason(subResult.data) : null;
    if (subBlock) {
      gate = {
        icon: '💸',
        title: 'Gói cước cần được kích hoạt',
        description: subBlock,
        ctaLabel: 'Xem & thanh toán',
        ctaHref: '/host/settings/subscription',
        secondaryLabel: 'Về tổng quan',
        secondaryHref: '/host',
      };
    }
  }

  if (gate) {
    return NextResponse.json({
      data: { gate, loadFailed: false, properties: [] as PropertyOption[] },
    });
  }

  const result = await listPropertiesAction({ includeInactive: false });
  const properties: PropertyOption[] = result.ok
    ? result.data.map((p) => ({
        id: p.id,
        name: p.name,
        standardGuests: p.standardGuests,
        maxGuests: p.maxGuests,
      }))
    : [];

  return NextResponse.json({
    data: { gate: null, loadFailed: !result.ok, properties },
  });
}
