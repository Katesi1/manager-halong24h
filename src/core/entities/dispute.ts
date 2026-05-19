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

export interface DisputeEvidence {
  id: string;
  type: 'image' | 'pdf' | 'video' | 'link';
  url: string;
  caption: string | null;
  uploadedBy: { id: string; name: string; role: OpenerRole };
  uploadedAt: string;
}

export interface DisputeChatExcerpt {
  id: string;
  messageId: string;
  content: string;
  sender: { id: string; name: string; role: 'customer' | 'owner' };
  sentAt: string;
  attachmentUrl?: string | null;
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

/** @deprecated giữ alias để legacy code không vỡ */
export type DisputeSide = 'guest' | 'host' | 'split';
