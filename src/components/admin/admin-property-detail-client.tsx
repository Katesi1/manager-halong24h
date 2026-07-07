'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ApprovalActions } from '@/components/admin/approval-actions';
import { HotToggle } from '@/components/admin/hot-toggle';
import { PageHeader } from '@/components/host/page-header';
import { AmenityList } from '@/components/property/amenity-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Property } from '@/core/entities/property';
import {
  cancellationPolicyLabel,
  propertyTypeLabel,
} from '@/core/value-objects/property-type';
import { formatVND } from '@/core/value-objects/vnd';
import { formatDateTime } from '@/lib/format';
import {
  MODERATION_STATUS_VARIANT,
  moderationStatusLabel,
} from '@/lib/property-moderation';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Chi tiết cơ sở (admin) fetch từ `/api/admin/properties/:id` PHÍA CLIENT →
 * endpoint hiện trong F12 Network. Loading/error/not-found ở client.
 */
export function AdminPropertyDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<Property>(
    `/api/admin/properties/${id}`,
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
  const cover = property.images.find((i) => i.isCover) ?? property.images[0];

  return (
    <>
      <PageHeader
        backHref="/admin/properties"
        backLabel="Quay lại danh sách cơ sở"
        title={property.name}
        description={
          (property.description?.slice(0, 100) ?? '') +
          (property.description && property.description.length > 100 ? '...' : '')
        }
        breadcrumbs={[
          { label: 'Cơ sở', href: '/admin/properties' },
          { label: property.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={MODERATION_STATUS_VARIANT[property.moderationStatus]}>
              {moderationStatusLabel(property.moderationStatus)}
            </Badge>
            {property.moderationStatus === 'approved' && (
              <Badge variant={property.isActive ? 'success' : 'default'}>
                {property.isActive ? 'Đang hiển thị' : 'Chủ đang ẩn'}
              </Badge>
            )}
            {property.isHot && <Badge variant="gold">🔥 Hot</Badge>}
          </div>
        }
      />

      {property.moderationStatus === 'rejected' &&
        property.moderationRejectedReason && (
          <div
            role="alert"
            className="mb-6 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200"
          >
            <span className="font-semibold">Lý do từ chối: </span>
            {property.moderationRejectedReason}
            {property.moderationReviewedAt && (
              <span className="ml-1 text-rose-700/70">
                ({formatDateTime(property.moderationReviewedAt)})
              </span>
            )}
          </div>
        )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {cover && (
            <div className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-ink-100">
              <Image
                src={cover.imageUrl}
                alt={property.name}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
              />
            </div>
          )}

          {property.owner && (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Chủ sở hữu
              </h2>
              <dl className="mt-4 grid gap-3 md:grid-cols-3">
                <div>
                  <dt className="text-xs text-ink-500">Họ tên</dt>
                  <dd className="text-sm font-semibold text-ink-900">
                    {property.owner.name}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">SĐT</dt>
                  <dd className="text-sm font-semibold text-ink-900">
                    {property.owner.phone ?? '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">Mã chủ sở hữu</dt>
                  <dd className="text-xs font-mono text-ink-700 break-all">
                    {property.owner.id}
                  </dd>
                </div>
              </dl>
            </section>
          )}

          {property.description && (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Mô tả
              </h2>
              <p className="mt-3 text-sm text-ink-700 whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Vị trí + chính sách
            </h2>
            <dl className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-500">Loại</dt>
                <dd className="text-sm text-ink-900">
                  {propertyTypeLabel(property.type)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Mã</dt>
                <dd className="text-sm font-mono text-ink-900">{property.code}</dd>
              </div>
              <div className="md:col-span-2">
                <dt className="text-xs text-ink-500">Địa chỉ</dt>
                <dd className="text-sm text-ink-900">{property.address ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Sức chứa</dt>
                <dd className="text-sm text-ink-900">
                  {property.bedrooms ?? '?'} PN · {property.bathrooms ?? '?'} WC ·
                  tối đa {property.maxGuests ?? '?'} khách
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Chính sách huỷ</dt>
                <dd className="text-sm text-ink-900">
                  {property.cancellationPolicy !== null &&
                  property.cancellationPolicy !== undefined
                    ? cancellationPolicyLabel(property.cancellationPolicy)
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Giờ nhận / trả phòng</dt>
                <dd className="text-sm text-ink-900">
                  {property.checkInTime ?? '14:00'} /{' '}
                  {property.checkOutTime ?? '12:00'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Hướng nhìn</dt>
                <dd className="text-sm text-ink-900">
                  {property.view === 'sea'
                    ? '🌊 Biển'
                    : property.view === 'city'
                      ? '🏙️ Phố'
                      : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Giá phòng
            </h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-3">
              <Stat label="Ngày thường" value={formatVND(property.weekdayPrice)} />
              <Stat label="Cuối tuần" value={formatVND(property.weekendPrice)} />
              <Stat label="Lễ tết" value={formatVND(property.holidayPrice)} />
            </dl>
          </section>

          {property.amenities.length > 0 && (
            <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
                Tiện ích
              </h2>
              <div className="mt-4">
                <AmenityList items={property.amenities} columns={3} />
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="sticky top-4 rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
            <h3 className="overline muted no-dash text-[10px]">Hành động Admin</h3>
            <div className="mt-4 space-y-3">
              <ApprovalActions
                propertyId={property.id}
                status={property.moderationStatus}
              />
              <HotToggle propertyId={property.id} isHot={property.isHot} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
            <h3 className="overline muted no-dash text-[10px]">Thống kê</h3>
            <dl className="mt-4 space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-ink-700">Đặt phòng</dt>
                <dd className="text-sm font-semibold text-ink-900">
                  {property.bookingCount}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-ink-700">Ảnh</dt>
                <dd className="text-sm font-semibold text-ink-900">
                  {property.images.length}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-ink-700">Phụ thu khách lớn</dt>
                <dd className="text-sm font-semibold text-ink-900">
                  {formatVND(property.adultSurcharge)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-ink-700">Phụ thu trẻ</dt>
                <dd className="text-sm font-semibold text-ink-900">
                  {formatVND(property.childSurcharge)}
                </dd>
              </div>
            </dl>
          </div>

          <Link href={`/host/properties/${property.id}/images`} className="block">
            <Button variant="outline" className="w-full">
              📷 Xem ảnh
            </Button>
          </Link>
        </aside>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-cream-100 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}
