import 'server-only';

import type {
  ApproveKycInput,
  KycAdminFilters,
  KycAdminSubmission,
  KycField,
  RejectKycInput,
} from '@/core/entities/kyc-admin';
import type { KycSubmissionStatus } from '@/core/entities/kyc';
import type { KycAdminRepository } from '@/application/ports/kyc-admin-repository';

import { apiClient } from '../http/api-client';

/**
 * Spec §9.2 — BE chỉ expose 4-state (`none|pending|approved|rejected`) v1.3
 * confirm web admin dùng 4-state. Entity local có 8-state (8 internal) — map
 * sang subset 4 spec hỗ trợ. `fields[]` (7 verification yếu tố) chưa có trong
 * spec response → trả mảng rỗng. UI section "Verification fields" sẽ blank
 * khi BE chưa expose; đợi v2.
 */
interface SpecKycSubmission {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  status: 'none' | 'pending' | 'approved' | 'rejected';
  rejectedReason?: string | null;
  rejectedAt?: string | null;
  approvedAt?: string | null;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  fields?: KycField[];
}

function mapStatus(s: SpecKycSubmission['status']): KycSubmissionStatus {
  // Entity 8-state có superset, dùng đúng subset spec.
  switch (s) {
    case 'pending':
      return 'awaiting_approval';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'none':
      return 'draft';
  }
}

function mapSubmission(s: SpecKycSubmission): KycAdminSubmission {
  return {
    id: s.id,
    ownerId: s.ownerId,
    ownerName: s.ownerName ?? '',
    ownerEmail: s.ownerEmail ?? '',
    ownerPhone: s.ownerPhone ?? '',
    status: mapStatus(s.status),
    fields: s.fields ?? [],
    rejectedReason: s.rejectedReason ?? null,
    rejectedAt: s.rejectedAt ?? null,
    approvedAt: s.approvedAt ?? null,
    submittedAt: s.submittedAt ?? s.createdAt,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

function reverseStatus(
  status: KycSubmissionStatus | undefined,
): string | undefined {
  if (!status) return undefined;
  if (status === 'awaiting_approval' || status === 'kyc_submitted')
    return 'pending';
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return undefined;
}

export class ApiKycAdminRepository implements KycAdminRepository {
  async list(filters?: KycAdminFilters): Promise<KycAdminSubmission[]> {
    const data = await apiClient.get<
      SpecKycSubmission[] | { items: SpecKycSubmission[] }
    >('/admin/kyc/queue', {
      query: {
        status: reverseStatus(filters?.status),
        search: filters?.search,
      },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    return arr.map(mapSubmission);
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

  async countPending(): Promise<number> {
    const data = await apiClient.get<number | { count: number }>(
      '/admin/kyc/count-pending',
      { cache: 'no-store' },
    );
    return typeof data === 'number' ? data : data.count;
  }
}
