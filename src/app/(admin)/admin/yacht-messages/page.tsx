import { YachtMessagesClient } from '@/components/admin/yacht-messages-client';
import { PageHeader } from '@/components/host/page-header';

export default function AdminYachtMessagesPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Tin nhắn du thuyền"
        description="Xem toàn bộ hội thoại khách ↔ hệ thống và trả lời. Tin nhắn tự làm mới định kỳ."
      />
      <YachtMessagesClient />
    </div>
  );
}
