import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getPropertyAction } from '@/app/actions/properties';
import { ApprovalActions } from '@/components/admin/approval-actions';
import { PageHeader } from '@/components/host/page-header';
import { AmenityList } from '@/components/property/amenity-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatVND } from '@/core/value-objects/vnd';
import {
  cancellationPolicyLabel,
  propertyTypeLabel,
} from '@/core/value-objects/property-type';

export async function generateMetadata(props: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await props.params;
  const result = await getPropertyAction(id);
  if (result.ok && result.data) {
    return { title: `${result.data.name} · Cơ sở (Admin)` };
  }
  return { title: 'Chi tiết cơ sở' };
}

export default async function AdminPropertyDetail(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const result = await getPropertyAction(id);
  if (!result.ok || result.data === null) notFound();
  const property = result.data;

  const cover = property.images.find((i) => i.isCover) ?? property.images[0];

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title={property.name}
        description={
          property.description?.slice(0, 100) +
          (property.description && property.description.length > 100 ? '...' : '')
        }
        breadcrumbs={[
          { label: 'Cơ sở', href: '/admin/properties' },
          { label: property.name },
        ]}
        actions={
          <Badge variant={property.isActive ? 'success' : 'default'}>
            {property.isActive ? 'Đang hoạt động' : 'Tạm tắt'}
          </Badge>
        }
      />

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

          {/* Owner */}
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
              <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">Mô tả</h2>
              <p className="mt-3 text-sm text-ink-700 whitespace-pre-line">
                {property.description}
              </p>
            </section>
          )}

          {/* Address & policies */}
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
                <dd className="text-sm text-ink-900">
                  {property.address ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Sức chứa</dt>
                <dd className="text-sm text-ink-900">
                  {property.bedrooms ?? '?'} PN · {property.bathrooms ?? '?'} WC
                  · tối đa {property.maxGuests ?? '?'} khách
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
                  {property.checkInTime ?? '14:00'} / {property.checkOutTime ?? '12:00'}
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

          {/* Pricing */}
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

          {/* Amenities */}
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

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="sticky top-4 rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
            <h3 className="overline muted no-dash text-[10px]">
              Hành động Admin
            </h3>
            <div className="mt-4">
              <ApprovalActions
                propertyId={property.id}
                status={property.isActive ? 'active' : 'suspended'}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card">
            <h3 className="overline muted no-dash text-[10px]">
              Thống kê
            </h3>
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

          <Link
            href={`/host/properties/${property.id}/images`}
            className="block"
          >
            <Button variant="outline" className="w-full">
              📷 Xem ảnh
            </Button>
          </Link>
        </aside>
      </div>
    </div>
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
