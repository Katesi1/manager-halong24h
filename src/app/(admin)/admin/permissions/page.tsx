import type { Metadata } from 'next';

import { PermissionMatrix } from '@/components/admin/permission-matrix';
import { PageHeader } from '@/components/host/page-header';

export const metadata: Metadata = { title: 'Phân quyền' };

export default function AdminPermissionsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Cấu hình"
        title="Phân quyền hệ thống"
        description="Cấu hình quyền hạn cho từng vai trò. Thay đổi quyền có hiệu lực ngay lập tức."
      />
      <PermissionMatrix />
    </div>
  );
}
