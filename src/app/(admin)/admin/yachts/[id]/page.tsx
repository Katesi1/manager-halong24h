import { YachtDetailClient } from '@/components/admin/yacht-detail-client';
import { PageHeader } from '@/components/host/page-header';

export default async function YachtDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Chi tiết du thuyền"
        description="Cập nhật thông tin, hành trình, bảng giá và ảnh."
        backHref="/admin/yachts"
        backLabel="Danh sách du thuyền"
        breadcrumbs={[
          { label: 'Du thuyền', href: '/admin/yachts' },
          { label: 'Chi tiết' },
        ]}
      />
      <YachtDetailClient id={id} />
    </div>
  );
}
