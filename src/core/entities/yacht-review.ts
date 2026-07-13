/**
 * Đánh giá du thuyền — khách chấm sau chuyến đi (6 tiêu chí, giống review
 * homestay). Web quản lý kiểm duyệt: ẩn/khôi phục + phản hồi thay mặt hệ thống.
 *
 * BE: GET /admin/yacht-reviews?status=visible|hidden|all + DELETE (ẩn) +
 * POST /:id/restore + POST /yachts/:id/reviews/:reviewId/reply.
 */
export type YachtReviewStatus = 'visible' | 'hidden';

export interface YachtReviewBreakdown {
  cleanliness: number;
  location: number;
  amenities: number;
  service: number;
  value: number;
  accuracy: number;
}

export interface YachtReview {
  id: string;
  yacht: { id: string; name: string; code: string };
  customer: { id: string; name: string; avatarUrl?: string | null };
  breakdown: YachtReviewBreakdown;
  avgRating: number;
  /** avgRating làm tròn — dùng render sao + lọc. */
  rating: number;
  comment: string;
  photos: string[];
  reply: string | null;
  replyAt: string | null;
  status: YachtReviewStatus;
  hiddenReason: string | null;
  createdAt: string;
}

export interface YachtReviewFilters {
  /** 'visible' | 'hidden' | 'all' (mặc định all). */
  status?: YachtReviewStatus | 'all';
  page?: number;
  pageSize?: number;
}

export const YACHT_REVIEW_STATUS_LABEL: Record<YachtReviewStatus, string> = {
  visible: 'Đang hiển thị',
  hidden: 'Đã ẩn',
};
