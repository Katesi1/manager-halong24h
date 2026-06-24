/**
 * KYC submission — API spec §14.
 *
 * **Web chỉ hiển thị trạng thái read-only.** Việc upload 3 ảnh CCCD + selfie và
 * submit được thực hiện trên **app mobile Halong24h** (cùng BE endpoint, khác FE).
 * Web hướng user tải app khi KYC chưa approved.
 *
 * Lifecycle BE:
 *   draft → kyc_submitted → payment_pending → paid → awaiting_approval
 *     → approved | rejected (rejected resubmit qua app)
 */

export type KycType = 'cccd_front' | 'cccd_back' | 'selfie';

export type KycSubmissionStatus =
  | 'draft'
  | 'kyc_submitted'
  | 'payment_pending'
  | 'paid'
  | 'awaiting_approval'
  | 'approved'
  | 'rejected'
  | 'refunded';

export interface KycUpload {
  type: KycType;
  imageUrl: string;
  uploadedAt: string;
  ocrResult?: unknown;
}

export interface KycSubmission {
  id: string;
  status: KycSubmissionStatus;
  uploads: KycUpload[];
  rejectedReason?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * `kycStatus` BE trả ở `/kyc/status` có thể là vocab submission (lifecycle đầy
 * đủ) HOẶC vocab User profile (`none|pending|approved|rejected`) — gộp cả hai.
 */
export type KycStatusValue = KycSubmissionStatus | 'none' | 'pending';

export interface KycStatusResponse {
  kycStatus: KycStatusValue;
  submission: KycSubmission | null;
  kycBypass: boolean;
}

export const KYC_STATUS_LABEL: Record<KycStatusValue, string> = {
  none: 'Chưa nộp',
  pending: 'Đang chờ duyệt',
  draft: 'Nháp (chưa nộp)',
  kyc_submitted: 'Đã nộp — chờ duyệt',
  payment_pending: 'Chờ thanh toán phí',
  paid: 'Đã thanh toán',
  awaiting_approval: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
  refunded: 'Đã hoàn tiền',
};

export const KYC_TYPE_LABEL: Record<KycType, string> = {
  cccd_front: 'CCCD mặt trước',
  cccd_back: 'CCCD mặt sau',
  selfie: 'Ảnh chân dung (selfie)',
};
