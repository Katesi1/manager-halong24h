import { notFound } from 'next/navigation';

import { getPropertyAction } from '@/app/actions/properties';
import { ImageGrid } from '@/components/host/image-grid';
import { ImageUploader } from '@/components/host/image-uploader';
import { PageHeader } from '@/components/host/page-header';

export default async function PropertyImagesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const result = await getPropertyAction(id);
  if (!result.ok || result.data === null) notFound();
  const property = result.data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
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
            <ImageUploader kind="property" parentId={property.id} maxFiles={20} />
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
    </div>
  );
}
