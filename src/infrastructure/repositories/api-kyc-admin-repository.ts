import 'server-only';

import type {
  ApproveKycInput,
  KycAdminFilters,
  KycAdminListResult,
  KycAdminSubmission,
  KycField,
  KycQueueFilter,
  RejectKycInput,
} from '@/core/entities/kyc-admin';
import type { KycSubmissionStatus } from '@/core/entities/kyc';
import type { KycAdminRepository } from '@/application/ports/kyc-admin-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec v1.11 §9.2 — Admin KYC list dùng một endpoint
 * `GET /admin/kyc/queue?filter=0|1|2|3&page&pageSize`. Response trả về
 * `{ filter, pendingCount, total, page, pageSize, items[] }`.
 *
 * Status BE trả camelCase: `kycSubmitted | paymentPending | awaitingApproval |
 * approved | rejected | refunded | draft`. Map sang entity snake_case
 * `KycSubmissionStatus` 8-state.
 *
 * `fields[]` (7 yếu tố verify) chưa có trong response queue → mảng rỗng.
 * UI section verify sẽ blank cho đến khi BE expose v2.
 *
 * User info shape mới (v1.11): nested `user: { id, name, phone, email }`.
 */
type SpecKycStatus =
  | 'draft'
  | 'kycSubmitted'
  | 'paymentPending'
  | 'awaitingApproval'
  | 'approved'
  | 'rejected'
  | 'refunded';

interface SpecKycUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
}

interface SpecKycSubmission {
  id: string;
  status: SpecKycStatus;
  statusFilter?: 1 | 2 | 3;
  user?: SpecKycUser;
  // Legacy flat fields (giữ tương thích nếu BE còn trả)
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  rejectedReason?: string | null;
  rejectReason?: string | null;
  rejectedAt?: string | null;
  approvedAt?: string | null;
  submittedAt?: string;
  createdAt: string;
  updatedAt?: string;
  fields?: KycField[];
}

interface SpecQueueResponse {
  filter: KycQueueFilter;
  pendingCount: number;
  total: number;
  page: number;
  pageSize: number;
  items: SpecKycSubmission[];
}

function mapStatus(s: SpecKycStatus): KycSubmissionStatus {
  switch (s) {
    case 'kycSubmitted':
      return 'kyc_submitted';
    case 'paymentPending':
      return 'payment_pending';
    case 'awaitingApproval':
      return 'awaiting_approval';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'refunded':
      return 'refunded';
    case 'draft':
      return 'draft';
  }
}

function mapSubmission(s: SpecKycSubmission): KycAdminSubmission {
  const now = s.updatedAt ?? s.createdAt;
  return {
    id: s.id,
    ownerId: s.user?.id ?? s.ownerId ?? '',
    ownerName: s.user?.name ?? s.ownerName ?? '',
    ownerEmail: s.user?.email ?? s.ownerEmail ?? '',
    ownerPhone: s.user?.phone ?? s.ownerPhone ?? '',
    status: mapStatus(s.status),
    fields: s.fields ?? [],
    rejectedReason: s.rejectedReason ?? s.rejectReason ?? null,
    rejectedAt: s.rejectedAt ?? null,
    approvedAt: s.approvedAt ?? null,
    submittedAt: s.submittedAt ?? s.createdAt,
    createdAt: s.createdAt,
    updatedAt: now,
  };
}

export class ApiKycAdminRepository implements KycAdminRepository {
  async list(filters?: KycAdminFilters): Promise<KycAdminListResult> {
    const filter: KycQueueFilter = filters?.filter ?? 1;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const data = await apiClient.get<SpecQueueResponse>('/admin/kyc/queue', {
      query: {
        filter,
        page,
        pageSize,
        search: filters?.search,
      },
      cache: 'no-store',
    });
    return {
      filter: data.filter ?? filter,
      pendingCount: data.pendingCount ?? 0,
      total: data.total ?? data.items.length,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize,
      items: data.items.map(mapSubmission),
    };
  }

  async getById(id: string): Promise<KycAdminSubmission | null> {
    try {
      const data = await apiClient.get<SpecKycSubmission>(
        `/kyc/submissions/${id}`,
        { cache: 'no-store' },
      );
      return mapSubmission(data);
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

  async approve(input: ApproveKycInput): Promise<KycAdminSubmission> {
    const data = await apiClient.post<SpecKycSubmission>(
      `/admin/kyc/submissions/${input.submissionId}/approve`,
      // trialDays mặc định 7 do BE quyết định
    );
    return mapSubmission(data);
  }

  async reject(input: RejectKycInput): Promise<KycAdminSubmission> {
    const data = await apiClient.post<SpecKycSubmission>(
      `/admin/kyc/submissions/${input.submissionId}/reject`,
      { reason: input.reason },
    );
    return mapSubmission(data);
  }

  /**
   * Spec v1.11: ưu tiên `pendingCount` từ `list()`. Endpoint cũ vẫn chạy
   * (deprecated) — dùng làm fallback khi caller chưa migrate. Để tránh
   * gọi 2 round trip, gọi list với pageSize=1 filter=1.
   */
  async countPending(): Promise<number> {
    const result = await this.list({ filter: 1, page: 1, pageSize: 1 });
    return result.pendingCount;
  }
}
