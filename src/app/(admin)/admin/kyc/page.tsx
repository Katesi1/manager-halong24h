import type { Metadata } from 'next';

import { AdminKycClient } from '@/components/admin/admin-kyc-client';
import { PageHeader } from '@/components/host/page-header';
import type { KycQueueFilter } from '@/core/entities/kyc-admin';

export const metadata: Metadata = { title: 'Duyệt KYC' };

function parseFilter(raw: string | undefined): KycQueueFilter {
  if (raw === '1') return 1;
  if (raw === '2') return 2;
  if (raw === '3') return 3;
  return 0;
}

export default async function AdminKycPage(props: {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>;
}) {
  const sp = await props.searchParams;
  const filter = parseFilter(sp.filter);
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Duyệt hồ sơ KYC"
        description="Kiểm tra 5 yếu tố xác minh (CCCD trước/sau, ảnh chân dung, SĐT, Gmail) trước khi duyệt cho chủ nhà nhận booking."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/kyc → hiện endpoint trong Network */}
      <AdminKycClient filter={filter} q={sp.q?.trim() || undefined} page={page} />
    </div>
  );
}
