import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';

import { getCurrentProfile } from '@/app/actions/auth';
import { countPendingKycAdminAction } from '@/app/actions/kyc-admin';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { isAdmin } from '@/core/value-objects/role';

const cachedCountPendingKyc = unstable_cache(
  async () => countPendingKycAdminAction(),
  ['kyc-pending-count'],
  { revalidate: 60, tags: ['kyc-pending-count'] },
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');
  if (!isAdmin(profile.role)) redirect('/host');

  const kycCountResult = await cachedCountPendingKyc();
  const kycPending = kycCountResult.ok ? kycCountResult.data : 0;

  return (
    <div className="flex min-h-screen bg-cream-50">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:rounded focus:shadow-lg"
      >
        Bỏ qua đến nội dung chính
      </a>
      <ManagerSidebar profile={profile} badges={{ kyc: kycPending }} />
      <div className="flex-1 min-w-0">
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
