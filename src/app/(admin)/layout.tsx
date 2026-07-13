import { redirect } from 'next/navigation';
import { unstable_cache } from 'next/cache';

import { getCurrentProfile } from '@/app/actions/auth';
import { countPendingPropertiesAction } from '@/app/actions/admin';
import { countPendingBankAccountsAction } from '@/app/actions/bank-accounts';
import { countPendingKycAdminAction } from '@/app/actions/kyc-admin';
import { ChatSocketProvider } from '@/components/chat/chat-socket-provider';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { ManagerTopbar } from '@/components/layout/topbar';
import { isAdmin } from '@/core/value-objects/role';
import { canManageYachts } from '@/lib/yacht-access';
import { readTokens } from '@/infrastructure/http/token-storage';

const cachedCountPendingKyc = unstable_cache(
  async () => countPendingKycAdminAction(),
  ['kyc-pending-count'],
  { revalidate: 60, tags: ['kyc-pending-count'] },
);

const cachedCountPendingBank = unstable_cache(
  async () => countPendingBankAccountsAction(),
  ['bank-pending-count'],
  { revalidate: 60, tags: ['bank-pending-count'] },
);

const cachedCountPendingProperties = unstable_cache(
  async () => countPendingPropertiesAction(),
  ['properties-pending-count'],
  { revalidate: 60, tags: ['properties-pending-count'] },
);

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, tokens] = await Promise.all([
    getCurrentProfile(),
    readTokens(),
  ]);
  if (!profile) redirect('/login');
  // ADMIN dùng toàn bộ khu quản trị; SALE hệ thống (role=2, scope=system) được
  // vào để quản lý du thuyền (sidebar tự giới hạn về mảng du thuyền cho họ).
  if (!isAdmin(profile.role) && !canManageYachts(profile)) redirect('/host');

  const [kycCountResult, bankCountResult, propertiesPending] = await Promise.all([
    cachedCountPendingKyc(),
    cachedCountPendingBank(),
    cachedCountPendingProperties(),
  ]);
  const kycPending = kycCountResult.ok ? kycCountResult.data : 0;
  const bankPending = bankCountResult.ok ? bankCountResult.data : 0;

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
      <ManagerSidebar profile={profile} badges={{ kyc: kycPending, bank: bankPending, properties: propertiesPending }} />
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20">
          <ManagerTopbar profile={profile} adminAlerts={{ kycPending: kycPending }} />
        </header>
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
    </ChatSocketProvider>
  );
}
