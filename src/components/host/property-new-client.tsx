'use client';

import Link from 'next/link';

import { GuardBanner } from '@/components/host/guard-banner';
import { PageHeader } from '@/components/host/page-header';
import { PropertyWizard } from '@/components/host/property-wizard';
import type { HostGate } from '@/lib/host-gate';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Cổng tạo cơ sở fetch từ `/api/host/property-new-gate` PHÍA CLIENT → endpoint
 * hiện trong F12 Network. Route enforce guard server-side, client render.
 */
export function PropertyNewClient() {
  const { loading, error, data } = useApiResource<{ gate: HostGate | null }>(
    '/api/host/property-new-gate',
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-sm text-ink-500">
        Đang tải…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200 max-w-2xl mx-auto">
          {error ?? 'Không tải được trang'}
        </div>
      </div>
    );
  }

  if (data.gate) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <GuardBanner {...data.gate} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        backHref="/host/properties"
        backLabel="Quay lại danh sách cơ sở"
        title="Thêm cơ sở mới"
        description="Điền 4 bước thông tin. Sau khi tạo bạn có thể thêm ảnh + chỉnh giá chi tiết."
        breadcrumbs={[
          { label: 'Cơ sở', href: '/host/properties' },
          { label: 'Thêm mới' },
        ]}
      />
      <PropertyWizard />
      <div className="mt-6 text-sm text-ink-500">
        <Link href="/host/properties" className="hover:underline">
          ← Hủy, quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
