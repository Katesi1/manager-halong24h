import type { Metadata } from 'next';
import { Search } from 'lucide-react';

import { HostMessagesClient } from '@/components/host/host-messages-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Tin nhắn' };

export default async function HostMessagesPage(props: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const sp = await props.searchParams;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Tin nhắn"
        description="Trò chuyện với khách. Phản hồi nhanh để tăng tỷ lệ chốt đặt phòng."
        actions={
          <button
            type="button"
            aria-label="Tìm kiếm"
            className="grid h-10 w-10 place-items-center rounded-lg border border-ink-200 hover:bg-cream-100"
          >
            <Search className="h-4 w-4 text-ink-700" />
          </button>
        }
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/host/messages → hiện endpoint trong Network */}
      <HostMessagesClient filter={sp.filter} />
    </div>
  );
}
