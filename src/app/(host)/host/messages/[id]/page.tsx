import type { Metadata } from 'next';

import { ChatDetailClient } from '@/components/chat/chat-detail-client';

export const metadata: Metadata = { title: 'Hội thoại' };

export default async function HostMessageDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Hội thoại fetch phía CLIENT từ /api/host/messages/:id → hiện trong Network;
          tin realtime tiếp theo đi qua WebSocket /chat */}
      <ChatDetailClient id={id} />
    </div>
  );
}
