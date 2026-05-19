import type { Metadata } from 'next';
import Link from 'next/link';

import { getCurrentProfile } from '@/app/actions/auth';
import { getKycStatusAction } from '@/app/actions/kyc';
import { KycForm } from '@/components/host/kyc-form';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import { RoleCode } from '@/core/value-objects/role';

export const metadata: Metadata = { title: 'Xác minh KYC' };

export default async function HostKycPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null; // layout đã redirect /login

  const isOwner = profile.role === RoleCode.OWNER;
  if (!isOwner) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <PageHeader
          title="KYC — Xác minh chủ nhà"
          breadcrumbs={[
            { label: 'Cài đặt', href: '/host/settings' },
            { label: 'KYC' },
          ]}
        />
        <div className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <p className="text-sm text-ink-700">
            Chỉ tài khoản chủ nhà (OWNER) mới cần nộp KYC. Tài khoản nhân viên
            (SALE) không phải nộp.
          </p>
          <div className="mt-4">
            <Link href="/host/settings">
              <Button variant="outline">← Về Cài đặt</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const kycResult = await getKycStatusAction();
  const kycStatus = kycResult.ok ? kycResult.data.kycStatus : 'none';
  const kycBypass = kycResult.ok ? kycResult.data.kycBypass : false;

  const isApproved = kycStatus === 'approved' || kycBypass;
  const isPending =
    kycStatus === 'awaiting_approval' ||
    kycStatus === 'kyc_submitted' ||
    kycStatus === 'paid' ||
    kycStatus === 'payment_pending';

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="KYC — Xác minh chủ nhà"
        description="Nộp hồ sơ xác minh để được đăng cơ sở. Admin sẽ duyệt trong 2-3 ngày làm việc."
        breadcrumbs={[
          { label: 'Cài đặt', href: '/host/settings' },
          { label: 'KYC' },
        ]}
      />

      {isApproved && (
        <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 shadow-card">
          <p className="text-2xl">✅</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-emerald-900">
            Bạn đã được xác minh KYC. Có thể đăng cơ sở mới.
          </h2>
          <p className="mt-2 text-sm text-emerald-800">
            {kycBypass
              ? 'Tài khoản của bạn được Admin miễn xác minh (bypass).'
              : 'Hồ sơ KYC đã được duyệt.'}
          </p>
          <div className="mt-4 flex gap-2">
            <Link href="/host/properties/new">
              <Button>+ Đăng cơ sở mới</Button>
            </Link>
            <Link href="/host/settings">
              <Button variant="outline">← Về Cài đặt</Button>
            </Link>
          </div>
        </div>
      )}

      {!isApproved && isPending && (
        <div className="rounded-2xl bg-blue-50 p-6 ring-1 ring-blue-200 shadow-card">
          <p className="text-2xl">⏳</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-blue-900">
            Hồ sơ KYC đang chờ duyệt (2-3 ngày làm việc).
          </h2>
          <p className="mt-2 text-sm text-blue-800">
            Bạn sẽ nhận được thông báo qua email khi có kết quả. Trong thời gian
            này không cần nộp lại hồ sơ.
          </p>
          <div className="mt-4">
            <Link href="/host/settings">
              <Button variant="outline">← Về Cài đặt</Button>
            </Link>
          </div>
        </div>
      )}

      {!isApproved && !isPending && <KycForm />}
    </div>
  );
}
