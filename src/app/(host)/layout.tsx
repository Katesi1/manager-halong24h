import Link from 'next/link';

import { getDevBypassInfo } from '@/app/actions/auth';
import { getMySubscriptionAction } from '@/app/actions/subscriptions';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { HostTopbar } from '@/components/host/topbar';
import { Button } from '@/components/ui/button';
import { ForbiddenError } from '@/core/errors';
import { RoleCode } from '@/core/value-objects/role';
import { requireManagerRole } from '@/lib/auth-guard';
import { blockedReason } from '@/lib/subscription-guard';

export default async function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const devBypass = await getDevBypassInfo();

  let profile;
  try {
    profile = await requireManagerRole();
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return (
        <div className="min-h-screen bg-cream-50">
          {devBypass && (
            <div className="border-b border-amber-300 bg-amber-100 px-6 py-2 text-xs font-semibold text-amber-900">
              ⚠️ DEV_BYPASS_AUTH bật. Đang giả lập vai trò:{' '}
              <span className="font-mono">{devBypass.role}</span>. KHÔNG dùng
              cho production.
            </div>
          )}
          <ForbiddenScreen
            reason="Tài khoản của bạn không phải tài khoản quản lý. Đăng ký chủ nhà (OWNER) để truy cập."
            cta={
              <>
                <Link href="/signup">
                  <Button>Đăng ký chủ nhà</Button>
                </Link>
                <Link href="/">
                  <Button variant="outline">Về trang chủ</Button>
                </Link>
              </>
            }
          />
        </div>
      );
    }
    throw err;
  }

  // SALE chưa được Owner gán (`ownerId === null`)
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
    <div className="min-h-screen bg-cream-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Bỏ qua đến nội dung chính
      </a>
      <header>
        {devBypass && (
          <div className="border-b border-amber-300 bg-amber-100 px-6 py-2 text-xs font-semibold text-amber-900">
            ⚠️ DEV_BYPASS_AUTH bật. Đang giả lập vai trò:{' '}
            <span className="font-mono">{devBypass.role}</span>. KHÔNG dùng cho
            production.
          </div>
        )}
      </header>
      <div className="flex">
        <ManagerSidebar profile={profile} />
        <div className="flex-1 min-w-0">
          <header>
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
                <span className="font-semibold">⚠️ Gói cước bị chặn</span> —{' '}
                {subBlocked}{' '}
                <Link href="/host/settings/subscription" className="underline">
                  Xem chi tiết
                </Link>
              </div>
            )}
          </header>
          <main id="main-content">{children}</main>
        </div>
      </div>
    </div>
  );
}

function ForbiddenScreen({
  reason,
  cta,
}: {
  reason: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[calc(100vh-2.5rem)] place-items-center p-6">
      <div className="max-w-md text-center">
        <p className="text-3xl">🔒</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink-900">
          Bạn chưa có quyền truy cập
        </h1>
        <p className="mt-3 text-ink-700">{reason}</p>
        <div className="mt-6 flex justify-center gap-2">
          {cta ?? (
            <Link href="/">
              <Button>Về trang chủ</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
