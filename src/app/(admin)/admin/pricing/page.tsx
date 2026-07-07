import type { Metadata } from 'next';

import { AdminPricingClient } from '@/components/admin/admin-pricing-client';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Quản lý gói cước' };

export default function AdminPricingPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Cấu hình"
        title="Quản lý gói cước"
        description="Quản lý danh mục gói cước hiển thị cho chủ nhà. Bảng xem trước bên dưới là đúng những gì khách hàng nhìn thấy khi đăng ký."
      />

      {/* Dữ liệu fetch phía CLIENT từ /api/admin/pricing → hiện endpoint trong Network */}
      <AdminPricingClient />
    </div>
  );
}
