/**
 * KYC moderation (admin) — model 7 yếu tố theo business model 2026-05-15.
 *
 * Admin xem từng submission, verify 7 fields, approve hoặc reject (with reason).
 * Đây là port riêng cho admin; user-side KYC vẫn chỉ getStatus (xem ./kyc.ts).
 */

import type { KycSubmissionStatus } from './kyc';

export type KycVerification = 'pending' | 'matched' | 'mismatched';

export interface KycField {
  /** 1 trong 7 yếu tố */
  key:
    | 'business_license' // GPKD hoặc GCN hộ kinh doanh
    | 'cccd_front'
    | 'cccd_back'
    | 'selfie'
    | 'bank_account' // STK ngân hàng + chủ TK
    | 'vneid' // CCCD định danh điện tử
    | 'phone'
    | 'email';
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
  /** 7 yếu tố verify */
  fields: KycField[];
  /** Lý do reject nếu có */
  rejectedReason: string | null;
  rejectedAt: string | null;
  approvedAt: string | null;
  submittedAt: string;
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
  business_license: 'Giấy phép kinh doanh / Hộ kinh doanh',
  cccd_front: 'CCCD mặt trước',
  cccd_back: 'CCCD mặt sau',
  selfie: 'Ảnh chân dung (selfie)',
  bank_account: 'Số tài khoản ngân hàng',
  vneid: 'CCCD định danh điện tử (VNeID)',
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
