'use client';

import Link from 'next/link';

import { PageHeader } from '@/components/host/page-header';
import { PropertyWizard } from '@/components/host/property-wizard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Property } from '@/core/entities/property';
import {
  MODERATION_STATUS_VARIANT,
  moderationStatusLabel,
} from '@/lib/property-moderation';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Trang sửa cơ sở fetch từ `/api/properties/:id` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Loading/error/not-found ở client.
 */
export function PropertyEditClient({
  id,
  created,
}: {
  id: string;
  created?: boolean;
}) {
  const { loading, error, data } = useApiResource<Property>(
    `/api/properties/${id}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
        {error ?? 'Không tìm thấy cơ sở'}
      </div>
    );
  }

  const property = data;

  return (
    <>
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
            {property.moderationStatus === 'approved' ? (
              <Badge variant={property.isActive ? 'success' : 'default'}>
                {property.isActive ? 'Đang hoạt động' : 'Tạm tắt'}
              </Badge>
            ) : (
              <Badge variant={MODERATION_STATUS_VARIANT[property.moderationStatus]}>
                {moderationStatusLabel(property.moderationStatus)}
              </Badge>
            )}
            <Link href={`/host/properties/${property.id}/images`}>
              <Button variant="outline" size="sm">
                Quản lý ảnh →
              </Button>
            </Link>
          </>
        }
      />

      {created && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          ⏳ Đã gửi cơ sở. Cơ sở đang <strong>chờ quản trị viên duyệt</strong> —
          sau khi được duyệt sẽ hiển thị công khai và bắt đầu nhận booking. Trong
          lúc chờ, bạn có thể thêm ảnh + chỉnh giá chi tiết.
        </div>
      )}

      {!created && property.moderationStatus === 'pending' && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          ⏳ Cơ sở đang <strong>chờ quản trị viên duyệt</strong>. Sau khi được
          duyệt sẽ hiển thị công khai và nhận booking.
        </div>
      )}

      {property.moderationStatus === 'rejected' &&
        property.moderationRejectedReason && (
          <div className="mb-6 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200">
            <span className="font-semibold">Cơ sở bị từ chối: </span>
            {property.moderationRejectedReason}
            <span className="mt-1 block text-xs text-rose-700">
              Chỉnh sửa theo góp ý rồi lưu để gửi duyệt lại.
            </span>
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
    </>
  );
}
