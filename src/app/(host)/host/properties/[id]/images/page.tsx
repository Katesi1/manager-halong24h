import type { Metadata } from 'next';

import { PropertyImagesClient } from '@/components/host/property-images-client';

export const metadata: Metadata = { title: 'Quản lý ảnh' };

export default async function PropertyImagesPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Ảnh cơ sở fetch phía CLIENT từ /api/properties/:id → hiện trong Network */}
      <PropertyImagesClient id={id} />
    </div>
  );
}
