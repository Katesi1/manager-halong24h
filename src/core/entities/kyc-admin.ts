/**
 * KYC moderation (admin) — model 5 yếu tố khớp dữ liệu BE thật.
 *
 * Admin xem từng submission, verify 5 fields, approve hoặc reject (with reason).
 * Đây là port riêng cho admin; user-side KYC vẫn chỉ getStatus (xem ./kyc.ts).
 *
 * Lưu ý: DB chỉ có 3 ảnh upload (cccd_front/back/selfie) + phone/email trên User.
 * Không có business_license / bank_account / vneid → đã loại khỏi model.
 */

import type { KycSubmissionStatus } from './kyc';

export type KycVerification = 'pending' | 'matched' | 'mismatched';

export interface KycField {
  /** 1 trong 5 yếu tố */
  key: 'cccd_front' | 'cccd_back' | 'selfie' | 'phone' | 'email';
  label: string;
  /** URL ảnh / nội dung text */
  value: string | null;
  /** Trạng thái verify field này */
  verification: KycVerification;
  /** Ghi chú admin */
  note?: string | null;
}

export interface KycAdminSubmission {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  status: KycSubmissionStatus;
  /** 5 yếu tố verify */
  fields: KycField[];
  /** Lý do reject nếu có */
  rejectedReason: string | null;
  /** Các mục ảnh bị từ chối (BE: rejectedItems) — vd ['cccdFront','selfie'] */
  rejectedItems?: string[];
  rejectedAt: string | null;
  approvedAt: string | null;
  /** Số phòng chủ nhà đăng ký (BE: expectedRooms) */
  expectedRooms?: number | null;
  /** Thông tin thanh toán — chỉ có ở endpoint chi tiết */
  payment?: KycPayment | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Thanh toán gắn với hồ sơ KYC (detail §2). */
export interface KycPayment {
  /** Có ở endpoint chi tiết `/admin/kyc/:id`; list-level payment không có id. */
  id?: string;
  planId: string | null;
  cycle: string | null;
  rooms: number | null;
  totalAmount: number | null;
  method: string | null;
  status: string | null;
  paidAt: string | null;
}

/**
 * 1 ảnh upload đầy đủ trong hồ sơ chi tiết (`GET /admin/kyc/:id`).
 * Mỗi loại (cccdFront/cccdBack/selfie) có thể là `null` nếu chủ nhà chưa tải.
 */
export interface KycUploadDetail {
  id: string;
  imageUrl: string | null;
  imageUrlThumb: string | null;
  ocrResult: unknown;
  ocrConfidence: number | null;
  faceMatchScore: number | null;
  livenessScore: number | null;
  provider: string | null;
  uploadedAt: string | null;
}

/** 3 ảnh CCCD trước/sau + selfie của hồ sơ chi tiết. */
export interface KycUploadSet {
  cccdFront: KycUploadDetail | null;
  cccdBack: KycUploadDetail | null;
  selfie: KycUploadDetail | null;
}

/**
 * 1 mục trong checklist 7 yếu tố xác minh tự động (`verificationFields[]`).
 * `source` là chuỗi mô tả chi tiết điểm số / nguồn (vd "front=0.91, back=0.88").
 */
export interface KycVerificationField {
  key: string;
  label: string;
  passed: boolean;
  source?: string | null;
}

/**
 * Hồ sơ KYC chi tiết — `GET /admin/kyc/:id` (Auth ADMIN).
 *
 * Khác `KycAdminSubmission` (list-level, model 5 yếu tố thủ công): đây là dữ liệu
 * đầy đủ với 3 ảnh upload (kèm OCR / face-match / liveness), checklist 7 yếu tố
 * tự động + đếm pass/total, và danh sách thanh toán.
 */
export interface KycAdminDetail {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    avatar: string | null;
    role: number | null;
    kycBypass: boolean;
    kycStatus: KycSubmissionStatus | 'none';
    createdAt: string | null;
  };
  status: KycSubmissionStatus;
  statusLabel: string | null;
  rejectReason: string | null;
  rejectedItems: string[];
  approvedAt: string | null;
  approvedById: string | null;
  trialEndsAt: string | null;
  chargeStartsAt: string | null;
  expectedRooms: number | null;
  uploads: KycUploadSet;
  payments: KycPayment[];
  verificationFields: KycVerificationField[];
  verificationPassedCount: number;
  verificationTotalCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Spec v1.11 §9.2 — Admin KYC queue filter enum.
 * `0` = Tất cả (mọi status trừ draft)
 * `1` = Chờ duyệt (kyc_submitted, payment_pending, awaiting_approval)
 * `2` = Đã duyệt (approved, refunded)
 * `3` = Đã từ chối (rejected)
 */
export type KycQueueFilter = 0 | 1 | 2 | 3;

export interface KycAdminFilters {
  filter?: KycQueueFilter;
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface KycAdminListResult {
  items: KycAdminSubmission[];
  /** Số hồ sơ chờ duyệt (filter=1) — dùng badge sidebar */
  pendingCount: number;
  total: number;
  page: number;
  pageSize: number;
  filter: KycQueueFilter;
}

export const KYC_FIELD_LABEL: Record<KycField['key'], string> = {
  cccd_front: 'CCCD mặt trước',
  cccd_back: 'CCCD mặt sau',
  selfie: 'Ảnh chân dung (selfie)',
  phone: 'Số điện thoại',
  email: 'Email Gmail',
};

export const KYC_VERIFICATION_LABEL: Record<KycVerification, string> = {
  pending: 'Chờ kiểm tra',
  matched: 'Trùng khớp',
  mismatched: 'Không khớp',
};

export interface ApproveKycInput {
  submissionId: string;
}

export interface RejectKycInput {
  submissionId: string;
  reason: string;
}
