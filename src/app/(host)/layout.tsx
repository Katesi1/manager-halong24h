import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentProfile } from '@/app/actions/auth';
import { ChatSocketProvider } from '@/components/chat/chat-socket-provider';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { ManagerTopbar } from '@/components/layout/topbar';
import { RoleCode, isManagerRole } from '@/core/value-objects/role';
import { readTokens } from '@/infrastructure/http/token-storage';
import {
  SUBSCRIPTION_SETTINGS_PATH,
  ownerEntitlement,
} from '@/lib/entitlement';

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, tokens] = await Promise.all([
    getCurrentProfile(),
    readTokens(),
  ]);
  if (!profile) redirect('/login');
  if (!isManagerRole(profile.role)) redirect('/login');

  const isUnassignedSale =
    profile.role === RoleCode.SALE && profile.ownerId === null;

  const needsKyc =
    profile.role === RoleCode.OWNER &&
    profile.kycStatus !== 'approved' &&
    !profile.kycBypass;

  // v1.12 entitlement — suy ra từ profile (`GET /auth/profile`), nguồn tin cậy
  // nhất. Web được phép hiển thị countdown trial (§4.4); chỉ áp dụng cho OWNER.
  const entitlement =
    profile.role === RoleCode.OWNER ? ownerEntitlement(profile) : null;

  return (
    <ChatSocketProvider
      initialAccessToken={tokens.accessToken ?? ''}
      currentUserId={profile.id}
    >
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
          <ManagerTopbar profile={profile} />
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
          {entitlement?.blockReason && (
            <div className="border-b border-rose-200 bg-rose-50 px-6 py-2 text-xs text-rose-900">
              <span className="font-semibold">Tài khoản chưa đủ quyền</span> —{' '}
              {entitlement.blockReason}{' '}
              <Link href={SUBSCRIPTION_SETTINGS_PATH} className="underline">
                Đăng ký gói
              </Link>
            </div>
          )}
          {entitlement?.isTrial && entitlement.trialDaysLeft !== null && (
            <div className="border-b border-sky-200 bg-sky-50 px-6 py-2 text-xs text-sky-900">
              <span className="font-semibold">
                Đang dùng thử — còn {entitlement.trialDaysLeft} ngày
              </span>{' '}
              {needsKyc
                ? '· Hoàn tất KYC để bắt đầu đăng phòng.'
                : '· Đăng ký gói trước khi hết hạn để dùng liên tục.'}{' '}
              <Link href={SUBSCRIPTION_SETTINGS_PATH} className="underline">
                Xem gói
              </Link>
            </div>
          )}
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
    </ChatSocketProvider>
  );
}
