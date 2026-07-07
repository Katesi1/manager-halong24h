import type { Metadata } from 'next';

import { PropertyEditClient } from '@/components/host/property-edit-client';

export const metadata: Metadata = { title: 'Chỉnh sửa cơ sở' };

export default async function PropertyEditPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/properties/:id → hiện endpoint trong Network */}
      <PropertyEditClient id={id} created={sp.created === '1'} />
    </div>
  );
}
