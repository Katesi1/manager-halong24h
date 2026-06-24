/**
 * Review — đánh giá khách để lại sau khi check-out.
 *
 * Lifecycle:
 *   published (default) → hidden (admin ẩn vì spam/vi phạm) hoặc deleted (khách tự xoá)
 *
 * Spec §7 — /admin/reviews + /properties/:id/reviews live (ApiReviewRepository).
 */

export type ReviewStatus = 'published' | 'hidden' | 'deleted';

export type ReviewFlag =
  | 'profanity'
  | 'spam'
  | 'off_topic'
  | 'personal_info'
  | 'fake'
  | 'other';

export interface Review {
  id: string;
  bookingId: string;
  bookingCode: string;
  propertyId: string;
  propertyName: string;
  ownerId: string;
  ownerName: string;
  customer: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  rating: number; // 1..5
  comment: string;
  status: ReviewStatus;
  /** Owner phản hồi công khai */
  ownerReply: string | null;
  ownerReplyAt: string | null;
  /** Flag report từ owner/khách khác */
  flags: ReviewFlag[];
  flagReason: string | null;
  /** Admin ẩn → ghi lại ai + lý do */
  hiddenBy: { id: string; name: string } | null;
  hiddenAt: string | null;
  hiddenReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilters {
  status?: ReviewStatus;
  rating?: number;
  flagged?: boolean; // chỉ review bị flag
  propertyId?: string;
  ownerId?: string;
  search?: string;
}

export interface HideReviewInput {
  reviewId: string;
  reason: string;
}

export interface RestoreReviewInput {
  reviewId: string;
}

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  published: 'Đang hiển thị',
  hidden: 'Đã ẩn',
  deleted: 'Đã xoá',
};

export const REVIEW_FLAG_LABEL: Record<ReviewFlag, string> = {
  profanity: 'Ngôn ngữ tục',
  spam: 'Spam / quảng cáo',
  off_topic: 'Không liên quan',
  personal_info: 'Lộ thông tin cá nhân',
  fake: 'Đánh giá giả',
  other: 'Khác',
};
