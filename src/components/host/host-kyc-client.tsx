'use client';

import Link from 'next/link';

import { KycForm } from '@/components/host/kyc-form';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import type { KycStatusValue } from '@/core/entities/kyc';
import { useApiResource } from '@/lib/use-api-resource';

interface KycData {
  isOwner: boolean;
  kycStatus: KycStatusValue;
  kycBypass: boolean;
}

const HEADER = (
  <PageHeader
    title="KYC — Xác minh chủ nhà"
    description="Nộp hồ sơ xác minh để được đăng cơ sở. Admin sẽ duyệt trong 2-3 ngày làm việc."
    breadcrumbs={[
      { label: 'Cài đặt', href: '/host/settings' },
      { label: 'KYC' },
    ]}
  />
);

/**
 * Trạng thái KYC fetch từ `/api/host/kyc` PHÍA CLIENT → endpoint hiện trong F12
 * Network. Render form/banner theo trạng thái.
 */
export function HostKycClient() {
  const { loading, error, data } = useApiResource<KycData>('/api/host/kyc');

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {HEADER}
        <div className="py-8 text-center text-sm text-ink-500">Đang tải…</div>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        {HEADER}
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
          {error ?? 'Không tải được trạng thái KYC'}
        </div>
      </div>
    );
  }

  if (!data.isOwner) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
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

  const isApproved = data.kycStatus === 'approved' || data.kycBypass;
  const isPending =
    data.kycStatus === 'awaiting_approval' ||
    data.kycStatus === 'kyc_submitted' ||
    data.kycStatus === 'paid' ||
    data.kycStatus === 'payment_pending' ||
    data.kycStatus === 'pending';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      {HEADER}

      {isApproved && (
        <div className="rounded-2xl bg-emerald-50 p-6 ring-1 ring-emerald-200 shadow-card">
          <p className="text-2xl">✅</p>
          <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-emerald-900">
            Bạn đã được xác minh KYC. Có thể đăng cơ sở mới.
          </h2>
          <p className="mt-2 text-sm text-emerald-800">
            {data.kycBypass
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
