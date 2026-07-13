import Link from 'next/link';
import { Plus } from 'lucide-react';

import { YachtsBrowser } from '@/components/admin/yachts-browser';
import { PageHeader } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';

export default function AdminYachtsPage() {
  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Quản lý du thuyền"
        description="Danh mục du thuyền hiển thị cho khách. Thêm, sửa thông số, hành trình, bảng giá và ảnh."
        actions={
          <Link href="/admin/yachts/new">
            <Button>
              <Plus className="h-4 w-4" /> Thêm du thuyền
            </Button>
          </Link>
        }
      />
      <YachtsBrowser />
    </div>
  );
}
