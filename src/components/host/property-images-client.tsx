'use client';

import { ImageGrid } from '@/components/host/image-grid';
import { ImageUploader } from '@/components/host/image-uploader';
import { PageHeader } from '@/components/host/page-header';
import type { Property } from '@/core/entities/property';
import { useApiResource } from '@/lib/use-api-resource';

/**
 * Quản lý ảnh cơ sở fetch từ `/api/properties/:id` PHÍA CLIENT → endpoint hiện
 * trong F12 Network. Upload/xoá ảnh vẫn qua Server Action như cũ.
 */
export function PropertyImagesClient({ id }: { id: string }) {
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
        backHref={`/host/properties/${property.id}`}
        backLabel="Quay lại cơ sở"
        title="Quản lý ảnh"
        description={`Upload, đặt bìa, sắp xếp ảnh cho "${property.name}"`}
        breadcrumbs={[
          { label: 'Cơ sở', href: '/host/properties' },
          { label: property.name, href: `/host/properties/${property.id}` },
          { label: 'Ảnh' },
        ]}
      />

      <div className="space-y-8">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-ink-200/60 shadow-card">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Upload ảnh mới
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Tối đa 20 ảnh / cơ sở · JPG/PNG/WebP · ≤ 10MB / ảnh. Ảnh đầu tiên tự
            động được set làm ảnh bìa.
          </p>
          <div className="mt-4">
            <ImageUploader kind="property" parentId={property.id} maxFiles={20} existingCount={property.images.length} />
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
              Thư viện ảnh ({property.images.length})
            </h2>
            <p className="text-xs text-ink-500">Hover để Đặt bìa / Xóa</p>
          </div>
          <ImageGrid propertyId={property.id} images={property.images} />
        </section>
      </div>
    </>
  );
}
