import type { Metadata } from 'next';

import { SystemSettings } from '@/components/admin/system-settings';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Cài đặt hệ thống' };

export default function AdminSettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        eyebrow="Cấu hình"
        title="Cài đặt hệ thống"
        description="Cấu hình chung: chính sách huỷ, điều khoản, email, thông báo bảo trì."
      />
      <SystemSettings />
    </div>
  );
}
