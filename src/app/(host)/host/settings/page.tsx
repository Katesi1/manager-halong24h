import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';

export const metadata: Metadata = { title: 'Cài đặt' };
import { getKycStatusAction } from '@/app/actions/kyc';
import { PasswordForm } from '@/components/account/password-form';
import { ProfileForm } from '@/components/account/profile-form';
import { KycStatusCard } from '@/components/host/kyc-status-card';
import { NotificationPrefs } from '@/components/host/notifications/notification-prefs';
import { PageHeader } from '@/components/host/page-header';
import type { KycStatusResponse } from '@/core/entities/kyc';
import { RoleCode } from '@/core/value-objects/role';

export default async function HostSettingsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null; // layout đã redirect /login

  const isOwner = profile.role === RoleCode.OWNER;

  let kycStatus: KycStatusResponse | null = null;
  if (isOwner) {
    const r = await getKycStatusAction();
    if (r.ok) kycStatus = r.data;
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <PageHeader
        title="Cài đặt"
        description="Quản lý hồ sơ + bảo mật + KYC + thông báo."
      />

      <div className="grid gap-6">
        {/* Profile */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Hồ sơ
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Email và tên cá nhân.
          </p>
          <div className="mt-5">
            <ProfileForm
              defaults={{
                full_name: profile.name,
                email: profile.email,
                phone: profile.phone ?? '',
              }}
            />
          </div>
        </section>

        {/* KYC — chỉ OWNER mới có. Web có form upload tại /host/kyc. */}
        {isOwner && kycStatus && (
          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              KYC — Xác minh chủ nhà
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Hiển thị trạng thái xác minh CCCD + face match. Bạn có thể nộp hồ
              sơ trực tiếp trên web hoặc qua app mobile Halong24h.
            </p>
            <div className="mt-5">
              <KycStatusCard status={kycStatus} />
            </div>
            {kycStatus.kycStatus !== 'approved' && !kycStatus.kycBypass && (
              <div className="mt-4">
                <Link
                  href="/host/kyc"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-navy-900 hover:underline"
                >
                  Tải lên hồ sơ KYC →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Password */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Đổi mật khẩu
          </h2>
          <div className="mt-5">
            <PasswordForm />
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Thông báo
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Bật/tắt thông báo cho từng loại sự kiện. Lưu vào trình duyệt.
          </p>
          <NotificationPrefs profileId={profile.id} />
        </section>

        {/* Quick links */}
        <section className="grid gap-3 md:grid-cols-3">
          <Link
            href="/host/billing"
            className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300"
          >
            <p className="text-2xl">💳</p>
            <h3 className="mt-2 font-semibold text-ink-900">Gói cước</h3>
            <p className="text-xs text-ink-500">Subscription + thanh toán</p>
          </Link>
          {isOwner && (
            <Link
              href="/host/staff"
              className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300"
            >
              <p className="text-2xl">👤</p>
              <h3 className="mt-2 font-semibold text-ink-900">Nhân viên</h3>
              <p className="text-xs text-ink-500">Mời SALE</p>
            </Link>
          )}
          <Link
            href="/host/properties"
            className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300"
          >
            <p className="text-2xl">🏠</p>
            <h3 className="mt-2 font-semibold text-ink-900">Cơ sở</h3>
            <p className="text-xs text-ink-500">Quản lý property</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
