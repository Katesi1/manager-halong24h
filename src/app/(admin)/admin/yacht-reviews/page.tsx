import { YachtReviewsClient } from '@/components/admin/yacht-reviews-client';
import { PageHeader } from '@/components/host/page-header';

export default function AdminYachtReviewsPage() {
  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow="Du thuyền"
        title="Đánh giá du thuyền"
        description="Kiểm duyệt đánh giá khách sau chuyến đi: ẩn nội dung vi phạm, khôi phục, phản hồi thay mặt hệ thống. Ẩn/khôi phục sẽ tự tính lại điểm trung bình du thuyền."
      />
      <YachtReviewsClient />
    </div>
  );
}
