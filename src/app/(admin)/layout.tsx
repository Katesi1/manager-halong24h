import Link from 'next/link';
import { unstable_cache } from 'next/cache';

import { getDevBypassInfo } from '@/app/actions/auth';
import { countPendingKycAdminAction } from '@/app/actions/kyc-admin';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { Button } from '@/components/ui/button';
import { requireManagerRole } from '@/lib/auth-guard';
import { ForbiddenError } from '@/core/errors';
import { isAdmin, roleName } from '@/core/value-objects/role';

// Cache the pending KYC count to avoid hitting the API on every admin page nav.
// Revalidates every 60s; admin actions can call revalidateTag('kyc-pending-count').
const cachedCountPendingKyc = unstable_cache(
  async () => countPendingKycAdminAction(),
  ['kyc-pending-count'],
  { revalidate: 60, tags: ['kyc-pending-count'] },
);

function DevBypassBanner({ role }: { role: string }) {
  return (
    <div className="border-b border-amber-300 bg-amber-100 px-6 py-2 text-xs font-semibold text-amber-900">
      ⚠️ DEV_BYPASS_AUTH bật. Đang giả lập vai trò:{' '}
      <span className="font-mono">{role}</span>. KHÔNG dùng cho production.
    </div>
  );
}

export default async function AdminLayout({
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
          {devBypass && <DevBypassBanner role={devBypass.role} />}
          <ForbiddenScreen reason={err.message} />
        </div>
      );
    }
    throw err;
  }

  // Layer 2: chỉ ADMIN mới qua được /admin/*
  if (!isAdmin(profile.role)) {
    return (
      <div className="min-h-screen bg-cream-50">
        {devBypass && <DevBypassBanner role={devBypass.role} />}
        <ForbiddenScreen
          reason={`Trang Admin chỉ dành cho tài khoản ADMIN. Tài khoản hiện tại là ${roleName(profile.role)}.`}
          cta={
            <Link href="/host">
              <Button>Về trang chủ nhà</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const kycCountResult = await cachedCountPendingKyc();
  const kycPending = kycCountResult.ok ? kycCountResult.data : 0;

  return (
    <div className="min-h-screen bg-cream-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Bỏ qua đến nội dung chính
      </a>
      <header>{devBypass && <DevBypassBanner role={devBypass.role} />}</header>
      <div className="flex">
        <ManagerSidebar profile={profile} badges={{ kyc: kycPending }} />
        <div className="flex-1 min-w-0">
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
        <h1 className="mt-3 font-display text-3xl font-bold text-navy-900">
          Truy cập bị chặn
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
