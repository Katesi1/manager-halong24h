import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentProfile } from '@/app/actions/auth';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { HostTopbar } from '@/components/host/topbar';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';
import { blockedReason } from '@/lib/subscription-guard';

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (!isManagerRole(profile.role)) redirect('/login');

  const isUnassignedSale =
    profile.role === RoleCode.SALE && profile.ownerId === null;

  const topbarProfile = {
    full_name: profile.name,
    email: profile.email,
    role: (profile.role === RoleCode.SALE ? 'sale' : 'owner') as 'sale' | 'owner',
    avatar_url: null,
  };

  const needsKyc =
    profile.role === RoleCode.OWNER &&
    profile.kycStatus !== 'approved' &&
    !profile.kycBypass;

  const subResult = await getMySubscriptionAction();
  const subBlocked = subResult.ok ? blockedReason(subResult.data) : null;

  return (
    <div className="flex min-h-screen bg-cream-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Bỏ qua đến nội dung chính
      </a>
      <ManagerSidebar profile={profile} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20">
          <HostTopbar profile={topbarProfile} />
          {needsKyc && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-900">
              <span className="font-semibold">KYC chưa hoàn tất</span> — bạn
              cần nộp giấy tờ để có thể tạo và chỉnh sửa property.{' '}
              <Link href="/host/kyc" className="underline">
                Hoàn tất KYC
              </Link>
            </div>
          )}
          {isUnassignedSale && (
            <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-xs text-amber-900">
              <span className="font-semibold">
                Tài khoản chưa được gán Owner
              </span>{' '}
              — vui lòng liên hệ Admin để được kích hoạt quyền.
            </div>
          )}
          {subBlocked && (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-2 text-xs text-rose-900">
              <span className="font-semibold">Gói cước bị chặn</span> —{' '}
              {subBlocked}{' '}
              <Link href="/host/settings/subscription" className="underline">
                Xem chi tiết
              </Link>
            </div>
          )}
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
