import type { Metadata } from 'next';

import { listPropertiesAction } from '@/app/actions/properties';
import type { AdminPropertyRow } from '@/components/admin/admin-property-card';
import {
  PropertiesBrowser,
  type PropertiesBrowserInitial,
} from '@/components/admin/properties-browser';
import { PageHeader } from '@/components/host/page-header';
import type { ModerationStatus, Property } from '@/core/entities/property';
import { parsePage } from '@/lib/pagination';

export const metadata: Metadata = { title: 'Duyệt cơ sở' };

const STATUS_KEYS: ModerationStatus[] = [
  'pending',
  'approved',
  'rejected',
  'suspended',
];

/**
 * Map Property (DTO đầy đủ từ BE) → AdminPropertyRow rút gọn. Giảm payload
 * serialize xuống Client Component (bỏ amenities/policies/description/…).
 */
function toRow(p: Property): AdminPropertyRow {
  return {
    id: p.id,
    name: p.name,
    code: p.code,
    type: p.type,
    address: p.address,
    ownerId: p.ownerId,
    ownerName: p.owner?.name ?? null,
    moderationStatus: p.moderationStatus,
    isActive: p.isActive,
    isHot: p.isHot,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    maxGuests: p.maxGuests,
    standardGuests: p.standardGuests,
    weekdayPrice: p.weekdayPrice,
    coverUrl:
      p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl ?? null,
    bookingCount: p.bookingCount,
  };
}

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

  // Một lần fetch toàn bộ; lọc/tìm/sort/phân trang do Client Component xử lý
  // in-memory ⇒ thao tác sau đó không gọi lại BE.
  const result = await listPropertiesAction({ includeInactive: true });
  const rows: AdminPropertyRow[] = result.ok ? result.data.map(toRow) : [];
  const apiError = !result.ok ? result.error : null;

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

      <PropertiesBrowser rows={rows} apiError={apiError} initial={initial} />
    </div>
  );
}
