import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPropertyAction } from '@/app/actions/properties';
import { PageHeader } from '@/components/host/page-header';
import { PropertyWizard } from '@/components/host/property-wizard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getPropertyAction(id);
  if (result.ok && result.data) {
    return { title: `${result.data.name} · Cơ sở` };
  }
  return { title: 'Chỉnh sửa cơ sở' };
}

export default async function PropertyEditPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const result = await getPropertyAction(id);
  if (!result.ok || result.data === null) notFound();
  const property = result.data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        backHref="/host/properties"
        backLabel="Quay lại danh sách cơ sở"
        title={property.name}
        description="Chỉnh sửa thông tin cơ sở. Thay đổi áp dụng ngay sau khi lưu."
        breadcrumbs={[
          { label: 'Cơ sở', href: '/host/properties' },
          { label: property.name },
        ]}
        actions={
          <>
            <Badge variant={property.isActive ? 'success' : 'default'}>
              {property.isActive ? 'Đang hoạt động' : 'Tạm tắt'}
            </Badge>
            <Link href={`/host/properties/${property.id}/images`}>
              <Button variant="outline" size="sm">
                Quản lý ảnh →
              </Button>
            </Link>
          </>
        }
      />

      {sp.created === '1' && (
        <div className="mb-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 ring-1 ring-emerald-100">
          ✓ Đã tạo cơ sở. Bây giờ thêm ảnh + chỉnh giá chi tiết để bắt đầu nhận booking.
        </div>
      )}

      <PropertyWizard property={property} />

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <Link
          href={`/host/properties/${property.id}/images`}
          className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300 transition-all"
        >
          <p className="text-2xl">📷</p>
          <h3 className="mt-2 font-semibold text-ink-900">Quản lý ảnh</h3>
          <p className="mt-1 text-xs text-ink-500">
            {property.images.length} ảnh · Upload, đặt bìa, sắp xếp
          </p>
        </Link>
        <Link
          href={`/host/calendar?property=${property.id}`}
          className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300 transition-all"
        >
          <p className="text-2xl">📅</p>
          <h3 className="mt-2 font-semibold text-ink-900">Lịch grid</h3>
          <p className="mt-1 text-xs text-ink-500">Xem trống/bận theo ngày</p>
        </Link>
        <Link
          href={`/host/bookings?propertyId=${property.id}`}
          className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300 transition-all"
        >
          <p className="text-2xl">📋</p>
          <h3 className="mt-2 font-semibold text-ink-900">Đặt phòng</h3>
          <p className="mt-1 text-xs text-ink-500">
            {property.bookingCount} lượt · Quản lý
          </p>
        </Link>
      </div>
    </div>
  );
}
