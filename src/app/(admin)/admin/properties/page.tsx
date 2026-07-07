import type { Metadata } from 'next';

import { PropertiesBrowserFetch } from '@/components/admin/properties-browser-fetch';
import type { PropertiesBrowserInitial } from '@/components/admin/properties-browser';
import { PageHeader } from '@/components/host/page-header';
import type { ModerationStatus } from '@/core/entities/property';
import { parsePage } from '@/lib/pagination';

export const metadata: Metadata = { title: 'Duyệt cơ sở' };

const STATUS_KEYS: ModerationStatus[] = [
  'pending',
  'approved',
  'rejected',
  'suspended',
];

export default async function AdminPropertiesPage(props: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    type?: string;
    sort?: string;
    page?: string;
  }>;
}) {
  const sp = await props.searchParams;

  const initial: PropertiesBrowserInitial = {
    status: STATUS_KEYS.includes((sp.status ?? '') as ModerationStatus)
      ? (sp.status as ModerationStatus)
      : '',
    q: sp.q ?? '',
    type: ['0', '1', '2'].includes(sp.type ?? '') ? (sp.type as string) : '',
    sort: ['name', 'bookings', 'price-asc', 'price-desc'].includes(sp.sort ?? '')
      ? (sp.sort as string)
      : 'name',
    page: parsePage(sp.page),
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Duyệt cơ sở"
        description="Duyệt / từ chối cơ sở mới · Tạm ngưng cơ sở vi phạm · Đánh dấu Hot."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/properties → hiện endpoint trong Network */}
      <PropertiesBrowserFetch initial={initial} />
    </div>
  );
}
