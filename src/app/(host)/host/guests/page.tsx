import { Users } from 'lucide-react';
import { PageHeader } from '@/components/host/page-header';

export default function HostGuestsPage() {
  // Module "Khách hàng" chưa có endpoint BE. Hồ sơ khách sẽ được hệ thống tự
  // tạo từ lịch sử đặt phòng khi BE bổ sung API — không hiển thị dữ liệu giả.
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Khách hàng"
        description="Hồ sơ khách + lịch sử đặt phòng + nhãn nội bộ (VIP, Khách quen, Hạn chế)"
      />

      <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
          <Users className="h-7 w-7 text-ink-400" />
        </div>
        <h2 className="font-display text-xl font-semibold tracking-tight text-navy-900">
          Chưa có hồ sơ khách hàng
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
          Khi có đặt phòng đầu tiên, hệ thống sẽ tự tạo hồ sơ khách cùng lịch sử
          đặt phòng và nhãn nội bộ. Tính năng đang chờ backend cung cấp dữ liệu.
        </p>
      </div>
    </div>
  );
}
