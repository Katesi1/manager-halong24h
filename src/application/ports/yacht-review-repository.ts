import type {
  YachtReview,
  YachtReviewFilters,
} from '@/core/entities/yacht-review';

export interface YachtReviewRepository {
  list(filters?: YachtReviewFilters): Promise<YachtReview[]>;
  /** Ẩn đánh giá (DELETE /admin/yacht-reviews/:id, body {reason?}). */
  hide(reviewId: string, reason?: string): Promise<YachtReview>;
  /** Khôi phục đánh giá đã ẩn. */
  restore(reviewId: string): Promise<YachtReview>;
  /** Phản hồi đánh giá thay mặt hệ thống (POST /yachts/:yachtId/reviews/:reviewId/reply). */
  reply(yachtId: string, reviewId: string, reply: string): Promise<YachtReview>;
}
