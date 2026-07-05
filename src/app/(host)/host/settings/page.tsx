import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { getKycStatusAction } from '@/app/actions/kyc';
import { PasswordForm } from '@/components/account/password-form';
import { ProfileForm } from '@/components/account/profile-form';
import { KycStatusCard } from '@/components/host/kyc-status-card';
import { NotificationPrefs } from '@/components/host/notifications/notification-prefs';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { BANK_STATUS_LABEL, type BankStatus } from '@/core/entities/bank-account';
import type { KycStatusResponse } from '@/core/entities/kyc';
import { RoleCode } from '@/core/value-objects/role';

export const metadata: Metadata = { title: 'Cài đặt cá nhân' };

const ROLE_LABEL: Record<number, string> = {
  [RoleCode.ADMIN]: 'Quản trị viên',
  [RoleCode.OWNER]: 'Chủ nhà',
  [RoleCode.SALE]: 'Nhân viên bán hàng',
  [RoleCode.CUSTOMER]: 'Khách hàng',
};

export default async function HostSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const isOwner = profile.role === RoleCode.OWNER;

  let kycStatus: KycStatusResponse | null = null;
  if (isOwner) {
    const r = await getKycStatusAction();
    if (r.ok) kycStatus = r.data;
  }

  const initials = (profile.name ?? profile.email ?? '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Cài đặt cá nhân"
        description="Quản lý hồ sơ, bảo mật, KYC và thông báo."
      />

      {/* ── Profile banner ── */}
      <section className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800" />
        <div className="px-6 pb-6 -mt-8">
          <div className="flex items-start gap-4">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white text-navy-900 font-display text-2xl font-bold shadow-card ring-4 ring-white">
              {initials}
            </div>
            <div className="min-w-0 pt-10">
              <h2 className="font-display text-xl font-semibold text-navy-900 truncate">
                {profile.name}
              </h2>
              <p className="text-sm text-ink-500 truncate">{profile.email}</p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-navy-50 px-2.5 py-0.5 text-[11px] font-medium text-navy-700">
                  {ROLE_LABEL[profile.role] ?? 'Người dùng'}
                </span>
                {profile.phone && (
                  <span className="text-xs text-ink-500">{profile.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sections with left nav anchors ── */}
      <div className="mt-6 grid gap-6">
        {/* Profile form */}
        <SettingsCard
          id="profile"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
          title="Hồ sơ cá nhân"
          description="Cập nhật tên, email và số điện thoại của bạn."
        >
          <ProfileForm
            defaults={{
              full_name: profile.name,
              email: profile.email,
              phone: profile.phone ?? '',
            }}
          />
        </SettingsCard>

        {/* KYC */}
        {isOwner && kycStatus && (
          <SettingsCard
            id="kyc"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="KYC — Xác minh chủ nhà"
            description="Trạng thái xác minh CCCD + face match. Nộp hồ sơ trên web hoặc app mobile."
          >
            <KycStatusCard status={kycStatus} />
            {kycStatus.kycStatus !== 'approved' && !kycStatus.kycBypass && (
              <div className="mt-4">
                <Link
                  href="/host/kyc"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
                >
                  Tải lên hồ sơ KYC
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </SettingsCard>
        )}

        {/* Tài khoản nhận tiền (OWNER) */}
        {isOwner && (
          <SettingsCard
            id="bank"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="3" y1="22" x2="21" y2="22" />
                <line x1="6" y1="18" x2="6" y2="11" />
                <line x1="10" y1="18" x2="10" y2="11" />
                <line x1="14" y1="18" x2="14" y2="11" />
                <line x1="18" y1="18" x2="18" y2="11" />
                <polygon points="12 2 20 7 4 7" />
              </svg>
            }
            title="Tài khoản nhận tiền"
            description="STK ngân hàng nhận cọc từ khách (sinh mã VietQR). Cần quản trị viên duyệt."
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-ink-600">Trạng thái:</span>
                <Badge variant={bankStatusVariant(profile.bankStatus)}>
                  {BANK_STATUS_LABEL[normalizeBankStatus(profile.bankStatus)]}
                </Badge>
              </div>
              <Link
                href="/host/settings/bank"
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-navy-800"
              >
                Quản lý tài khoản nhận tiền
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </SettingsCard>
        )}

        {/* Password */}
        <SettingsCard
          id="password"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          }
          title="Đổi mật khẩu"
          description="Nhập mật khẩu hiện tại và mật khẩu mới để thay đổi."
        >
          <PasswordForm />
        </SettingsCard>

        {/* Notifications */}
        <SettingsCard
          id="notifications"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
          }
          title="Thông báo"
          description="Bật/tắt thông báo cho từng loại sự kiện. Lưu vào trình duyệt."
        >
          <NotificationPrefs profileId={profile.id} />
        </SettingsCard>
      </div>
    </div>
  );
}

function normalizeBankStatus(s: BankStatus | null | undefined): BankStatus {
  return s ?? 'none';
}

function bankStatusVariant(
  s: BankStatus | null | undefined,
): Parameters<typeof Badge>[0]['variant'] {
  switch (s) {
    case 'approved':
      return 'success';
    case 'pending':
      return 'gold';
    case 'rejected':
      return 'danger';
    default:
      return 'default';
  }
}

function SettingsCard({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card overflow-hidden"
    >
      <div className="border-b border-ink-100 px-6 py-4 flex items-center gap-3">
        <div className="rounded-lg bg-cream-100 p-2 text-navy-700">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold tracking-tight text-navy-900">
            {title}
          </h2>
          <p className="text-xs text-ink-500">{description}</p>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
