import type { Metadata } from 'next';
import Link from 'next/link';

import { PropertiesGridClient } from '@/components/host/properties-grid-client';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Cơ sở của tôi' };

export default function PropertiesListPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Cơ sở của tôi"
        description="Quản lý villa, homestay, khách sạn bạn đang vận hành."
        actions={
          <Link href="/host/properties/new">
            <Button>+ Thêm cơ sở</Button>
          </Link>
        }
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/properties → hiện endpoint trong Network */}
      <PropertiesGridClient />
    </div>
  );
}
