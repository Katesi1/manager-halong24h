import { YachtForm } from '@/components/admin/yacht-form';
import { PageHeader } from '@/components/host/page-header';

export default function NewYachtPage() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Thêm du thuyền"
        description="Điền thông tin cơ bản, hành trình và bảng giá. Ảnh có thể thêm sau khi tạo."
        backHref="/admin/yachts"
        backLabel="Danh sách du thuyền"
        breadcrumbs={[
          { label: 'Du thuyền', href: '/admin/yachts' },
          { label: 'Thêm mới' },
        ]}
      />
      <YachtForm />
    </div>
  );
}
