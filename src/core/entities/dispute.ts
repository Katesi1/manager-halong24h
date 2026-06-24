/**
 * Dispute — khiếu nại / tranh chấp giữa khách và chủ nhà.
 *
 * Theo business model 2026-05-15: Halong24h là trung gian. Khi có khiếu nại,
 * admin đọc lại chat + bill trên hệ thống → ra phán quyết.
 */

export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'rejected';

export type DisputeType =
  | 'refund'
  | 'quality'
  | 'no_show'
  | 'behavior'
  | 'fraud'
  | 'other';

export type DisputePriority = 'low' | 'medium' | 'high';

export type OpenerRole = 'customer' | 'owner' | 'admin' | 'anonymous';

/** Kết quả phán quyết của admin */
export type DisputeVerdict =
  | 'favor_customer'
  | 'favor_owner'
  | 'split'
  | 'no_fault';

export type PenaltyType =
  | 'none'
  | 'warn'
  | 'rating_down'
  | 'ban_temp'
  | 'ban_permanent'
  | 'kyc_revoke'
  | 'refund_required';

/**
 * Mức xử phạt mà BE lưu trên dispute (spec `POST /resolve` body field
 * `penalty` + `GET /:id` response). Đây là enum phẳng của BE — KHÁC với
 * object `penalty` rich FE-internal (`PenaltyType` + target + duration).
 *
 * Lưu ý: chọn mức phạt KHÔNG tự động ban user — admin phải gọi ban riêng.
 */
export type DisputePenalty =
  | 'none'
  | 'warning'
  | 'refund'
  | 'ban_temp'
  | 'ban_perm';

export interface DisputeEvidence {
  id: string;
  type: 'image' | 'pdf' | 'video' | 'link';
  url: string;
  caption: string | null;
  uploadedBy: { id: string; name: string; role: OpenerRole };
  uploadedAt: string;
}

/**
 * Tin nhắn trích từ cuộc trò chuyện của đơn đặt phòng (tối đa 20 tin mới
 * nhất, sắp xếp cũ → mới). BE trả `{ id, senderId, content, createdAt,
 * isSystem }`; `isSystem=true` là tin hệ thống (vd: "đã xác nhận đặt phòng").
 */
export interface DisputeChatExcerpt {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isSystem: boolean;
}

export interface DisputeParty {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface Dispute {
  id: string;
  bookingId: string;
  bookingCode: string;
  propertyId: string;
  propertyName: string;
  propertyCode: string | null;
  customer: DisputeParty;
  owner: DisputeParty;

  opener: { role: OpenerRole; name: string };

  type: DisputeType;
  status: DisputeStatus;
  priority: DisputePriority;

  subject: string;
  description: string;
  amount: number | null;

  evidence: DisputeEvidence[];
  chatExcerpts: DisputeChatExcerpt[];

  verdict: DisputeVerdict | null;
  penalty: {
    type: PenaltyType;
    target: 'customer' | 'owner' | null;
    durationDays: number | null;
    refundAmount: number | null;
  } | null;
  /**
   * Mức xử phạt BE lưu trên dispute (enum phẳng). `null` khi chưa có /
   * BE chưa trả. KHÔNG tự ban — admin gọi ban riêng.
   */
  penaltyAction: DisputePenalty | null;
  resolution: string | null;

  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; name: string } | null;
}

export interface DisputeFilters {
  status?: DisputeStatus;
  type?: DisputeType;
  priority?: DisputePriority;
  search?: string;
}

export interface ResolveDisputeInput {
  disputeId: string;
  verdict: DisputeVerdict;
  penalty: {
    type: PenaltyType;
    target: 'customer' | 'owner' | null;
    durationDays?: number;
    refundAmount?: number;
  };
  resolution: string;
  /** Mức xử phạt BE lưu (optional, enum phẳng). Mặc định không phạt. */
  penaltyAction?: DisputePenalty;
}

export interface RejectDisputeInput {
  disputeId: string;
  reason: string;
}

export const DISPUTE_STATUS_LABEL: Record<DisputeStatus, string> = {
  open: 'Mới mở',
  investigating: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  rejected: 'Đã bác bỏ',
};

export const DISPUTE_TYPE_LABEL: Record<DisputeType, string> = {
  refund: 'Tranh chấp hoàn tiền',
  quality: 'Khiếu nại chất lượng',
  no_show: 'No-show / huỷ đột ngột',
  behavior: 'Hành vi không phù hợp',
  fraud: 'Lừa đảo / gian lận',
  other: 'Khác',
};

export const DISPUTE_TYPE_ICON: Record<DisputeType, string> = {
  refund: '💰',
  quality: '🛏️',
  no_show: '🚫',
  behavior: '⚠️',
  fraud: '🚨',
  other: '❓',
};

export const VERDICT_LABEL: Record<DisputeVerdict, string> = {
  favor_customer: 'Ủng hộ khách',
  favor_owner: 'Ủng hộ chủ nhà',
  split: 'Chia trách nhiệm 50/50',
  no_fault: 'Không bên nào có lỗi',
};

export const PENALTY_LABEL: Record<PenaltyType, string> = {
  none: 'Không phạt',
  warn: 'Cảnh báo',
  rating_down: 'Trừ điểm rating',
  ban_temp: 'Ban tạm thời',
  ban_permanent: 'Ban vĩnh viễn',
  kyc_revoke: 'Huỷ KYC (chủ nhà phải nộp lại)',
  refund_required: 'Yêu cầu hoàn tiền cho khách',
};

/** Nhãn tiếng Việt cho mức xử phạt BE (enum phẳng `DisputePenalty`). */
export const DISPUTE_PENALTY_LABEL: Record<DisputePenalty, string> = {
  none: 'Không phạt',
  warning: 'Cảnh báo',
  refund: 'Yêu cầu hoàn tiền',
  ban_temp: 'Ban tạm thời',
  ban_perm: 'Ban vĩnh viễn',
};

/** @deprecated giữ alias để legacy code không vỡ */
export type DisputeSide = 'guest' | 'host' | 'split';
