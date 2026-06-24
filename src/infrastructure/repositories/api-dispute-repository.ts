import 'server-only';

import type { OpenDisputeData } from '@/application/disputes/open';
import type {
  Dispute,
  DisputeChatExcerpt,
  DisputeEvidence,
  DisputeFilters,
  DisputePenalty,
  DisputeStatus,
  DisputeType,
  OpenerRole,
  RejectDisputeInput,
  ResolveDisputeInput,
} from '@/core/entities/dispute';
import type { DisputeRepository } from '@/application/ports/dispute-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec §13 + v1.3 §22 B3.
 *
 * `GET /admin/disputes/:id` (LIVE) trả thêm: `attachments[]`/`evidence[]`
 * (alias), `resolution`/`verdict` (alias), `penalty` (enum phẳng), và
 * `chatExcerpts[]` (≤20 tin mới nhất của hội thoại đơn, cũ→mới). Repo map
 * trực tiếp từ response thật. Danh sách (`GET /admin/disputes`) vẫn có thể
 * thiếu các field này → fallback `[]`/`null`.
 *
 * Spec dispute type: refund_request|service_quality|damage_claim|no_show|
 * overbooking|other → entity: refund|quality|behavior|no_show|fraud|other.
 */
const PENALTY_VALUES: readonly DisputePenalty[] = [
  'none',
  'warning',
  'refund',
  'ban_temp',
  'ban_perm',
];

interface SpecChatExcerpt {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isSystem?: boolean;
}

interface SpecDispute {
  id: string;
  bookingId: string;
  type:
    | 'refund_request'
    | 'service_quality'
    | 'damage_claim'
    | 'no_show'
    | 'overbooking'
    | 'other';
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  subject: string;
  description: string;
  amount: number | null;
  attachments?: string[];
  evidence?: string[];
  chatExcerpts?: SpecChatExcerpt[];
  penalty?: string | null;
  verdict?: string | null;
  openerType?: OpenerRole;
  openerName?: string;
  resolution?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
  // Hydrated fields BE có thể bundle (best-effort)
  property?: { id: string; name: string; code?: string | null };
  booking?: { id: string; code?: string };
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  owner?: { id: string; name: string; email: string; phone: string | null };
}

/** Suy loại file từ phần mở rộng URL — chỉ để chọn cách render. */
function evidenceTypeOf(url: string): DisputeEvidence['type'] {
  const lower = url.split('?')[0]?.toLowerCase() ?? '';
  if (/\.(jpg|jpeg|png|webp|gif|avif)$/.test(lower)) return 'image';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (/\.(mp4|mov|webm)$/.test(lower)) return 'video';
  return 'link';
}

/** Map mảng URL `evidence`/`attachments` → DisputeEvidence[] tối thiểu. */
function mapEvidence(urls: string[]): DisputeEvidence[] {
  return urls.map((url, i) => ({
    id: `ev-${i}`,
    type: evidenceTypeOf(url),
    url,
    caption: null,
    uploadedBy: { id: '', name: '', role: 'anonymous' },
    uploadedAt: '',
  }));
}

function mapChatExcerpts(raw: SpecChatExcerpt[]): DisputeChatExcerpt[] {
  return raw.map((m) => ({
    id: m.id,
    senderId: m.senderId,
    content: m.content,
    createdAt: m.createdAt,
    isSystem: m.isSystem === true,
  }));
}

/** BE penalty enum phẳng → entity, các giá trị lạ/`null` → null. */
function mapPenalty(raw: string | null | undefined): DisputePenalty | null {
  if (!raw) return null;
  return PENALTY_VALUES.includes(raw as DisputePenalty)
    ? (raw as DisputePenalty)
    : null;
}

function mapType(s: SpecDispute['type']): DisputeType {
  switch (s) {
    case 'refund_request':
      return 'refund';
    case 'service_quality':
      return 'quality';
    case 'damage_claim':
      return 'fraud';
    case 'no_show':
      return 'no_show';
    case 'overbooking':
      return 'fraud';
    case 'other':
      return 'other';
  }
}

function reverseType(t: DisputeType | undefined): string | undefined {
  if (!t) return undefined;
  const map: Record<DisputeType, string> = {
    refund: 'refund_request',
    quality: 'service_quality',
    no_show: 'no_show',
    behavior: 'service_quality',
    fraud: 'damage_claim',
    other: 'other',
  };
  return map[t];
}

function mapStatus(s: SpecDispute['status']): DisputeStatus {
  return s === 'pending' ? 'open' : s;
}

function reverseStatus(s: DisputeStatus | undefined): string | undefined {
  if (!s) return undefined;
  return s === 'open' ? 'pending' : s;
}

function mapDispute(s: SpecDispute): Dispute {
  const emptyParty = {
    id: '',
    name: '',
    email: '',
    phone: null,
  };
  // BE trả `evidence` và `attachments` là alias của nhau; ưu tiên evidence.
  const evidenceUrls = s.evidence ?? s.attachments ?? [];
  // `verdict` là alias của `resolution`; ưu tiên resolution (text gốc).
  const resolution = s.resolution ?? s.verdict ?? null;
  return {
    id: s.id,
    bookingId: s.bookingId,
    bookingCode: s.booking?.code ?? s.bookingId.slice(0, 8),
    propertyId: s.property?.id ?? '',
    propertyName: s.property?.name ?? '',
    propertyCode: s.property?.code ?? null,
    customer: s.customer ?? emptyParty,
    owner: s.owner ?? emptyParty,
    opener: {
      role: s.openerType ?? 'customer',
      name: s.openerName ?? '',
    },
    type: mapType(s.type),
    status: mapStatus(s.status),
    priority: 'medium',
    subject: s.subject,
    description: s.description,
    amount: s.amount,
    evidence: mapEvidence(evidenceUrls),
    chatExcerpts: mapChatExcerpts(s.chatExcerpts ?? []),
    // `verdict` (FE-internal: favor_customer|...) BE chưa expose riêng — giữ
    // null. Field `verdict` BE thực chất là alias text của resolution.
    verdict: null,
    penalty: null, // object rich FE-internal — BE chưa expose
    penaltyAction: mapPenalty(s.penalty),
    resolution,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    resolvedAt: s.resolvedAt ?? null,
    resolvedBy: s.resolvedBy ?? null,
  };
}

export class ApiDisputeRepository implements DisputeRepository {
  async list(filters?: DisputeFilters): Promise<Dispute[]> {
    const data = await apiClient.get<SpecDispute[] | { items: SpecDispute[] }>(
      '/admin/disputes',
      {
        query: {
          status: reverseStatus(filters?.status),
          type: reverseType(filters?.type),
          search: filters?.search,
        },
        cache: 'no-store',
      },
    );
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapDispute);
  }

  async getById(id: string): Promise<Dispute | null> {
    try {
      const data = await apiClient.get<SpecDispute>(`/admin/disputes/${id}`, {
        cache: 'no-store',
      });
      return mapDispute(data);
    } catch (err) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async countActive(): Promise<number> {
    const data = await apiClient.get<number | { count: number }>(
      '/admin/disputes/count-active',
      { cache: 'no-store' },
    );
    return typeof data === 'number' ? data : data.count;
  }

  async open(input: OpenDisputeData): Promise<Dispute> {
    const data = await apiClient.post<SpecDispute>('/disputes', {
      bookingId: input.bookingId,
      type: reverseType(input.type),
      subject: input.subject,
      description: input.description,
      amount: input.amount,
    });
    return mapDispute(data);
  }

  async startInvestigation(id: string): Promise<Dispute> {
    const data = await apiClient.post<SpecDispute>(
      `/admin/disputes/${id}/investigate`,
    );
    return mapDispute(data);
  }

  async resolve(input: ResolveDisputeInput): Promise<Dispute> {
    // Spec LIVE — body: resolution + refundAmount + penalty (optional enum).
    // Object `penalty` rich FE-internal (verdict/target/duration) không gửi BE.
    const data = await apiClient.post<SpecDispute>(
      `/admin/disputes/${input.disputeId}/resolve`,
      {
        resolution: input.resolution,
        refundAmount: input.penalty.refundAmount,
        ...(input.penaltyAction ? { penalty: input.penaltyAction } : {}),
      },
    );
    return mapDispute(data);
  }

  async reject(input: RejectDisputeInput): Promise<Dispute> {
    const data = await apiClient.post<SpecDispute>(
      `/admin/disputes/${input.disputeId}/reject`,
      { resolution: input.reason },
    );
    return mapDispute(data);
  }
}
