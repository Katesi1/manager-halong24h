import 'server-only';

import { NotFoundError } from '@/core/errors';
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

function matchesFilter(
  status: KycSubmissionStatus,
  filter: KycQueueFilter,
): boolean {
  if (filter === 0) return status !== 'draft';
  if (filter === 1)
    return (
      status === 'kyc_submitted' ||
      status === 'payment_pending' ||
      status === 'awaiting_approval'
    );
  if (filter === 2) return status === 'approved' || status === 'refunded';
  return status === 'rejected';
}

// SYNTHETIC TEST DATA — NOT REAL ACCOUNTS, do not use in production.
const KYC_DOC_PLACEHOLDER = '/placeholder-kyc-doc.svg';

function makeFields(): KycField[] {
  return [
    {
      key: 'cccd_front',
      label: 'CCCD mặt trước',
      value: KYC_DOC_PLACEHOLDER,
      verification: 'pending',
    },
    {
      key: 'cccd_back',
      label: 'CCCD mặt sau',
      value: KYC_DOC_PLACEHOLDER,
      verification: 'pending',
    },
    {
      key: 'selfie',
      label: 'Ảnh chân dung (selfie)',
      value: KYC_DOC_PLACEHOLDER,
      verification: 'pending',
    },
    {
      key: 'phone',
      label: 'Số điện thoại',
      value: '0000 000 004 · Đã xác thực OTP',
      verification: 'pending',
    },
    {
      key: 'email',
      label: 'Email',
      value: 'owner1@example.com · Đã xác thực',
      verification: 'pending',
    },
  ];
}

const SEED: KycAdminSubmission[] = [
  {
    id: 'kyc-sub-001',
    ownerId: 'owner-001',
    ownerName: 'Nguyễn Văn An',
    ownerEmail: 'owner1@example.com',
    ownerPhone: '0000 000 004',
    status: 'awaiting_approval',
    fields: makeFields(),
    rejectedReason: null,
    rejectedAt: null,
    approvedAt: null,
    submittedAt: '2026-05-12T08:30:00.000Z',
    createdAt: '2026-05-10T08:00:00.000Z',
    updatedAt: '2026-05-12T08:30:00.000Z',
  },
  {
    id: 'kyc-sub-002',
    ownerId: 'owner-002',
    ownerName: 'Trần Thị Bình',
    ownerEmail: 'binh.tran@example.com',
    ownerPhone: '0000 000 006',
    status: 'awaiting_approval',
    fields: makeFields().map((f) =>
      f.key === 'phone'
        ? { ...f, value: '0000 000 006 · Đã xác thực OTP' }
        : f,
    ),
    rejectedReason: null,
    rejectedAt: null,
    approvedAt: null,
    submittedAt: '2026-05-14T14:20:00.000Z',
    createdAt: '2026-05-13T10:00:00.000Z',
    updatedAt: '2026-05-14T14:20:00.000Z',
  },
  {
    id: 'kyc-sub-003',
    ownerId: 'owner-003',
    ownerName: 'Phạm Hữu Cường',
    ownerEmail: 'cuong.pham@example.com',
    ownerPhone: '0000 000 007',
    status: 'rejected',
    fields: makeFields().map((f) =>
      f.key === 'selfie'
        ? { ...f, verification: 'mismatched' as const }
        : { ...f, verification: 'matched' as const },
    ),
    rejectedReason:
      'Ảnh chân dung không khớp với CCCD. Vui lòng chụp lại selfie rõ mặt.',
    rejectedAt: '2026-05-15T16:00:00.000Z',
    approvedAt: null,
    submittedAt: '2026-05-15T10:00:00.000Z',
    createdAt: '2026-05-14T08:00:00.000Z',
    updatedAt: '2026-05-15T16:00:00.000Z',
  },
  {
    id: 'kyc-sub-004',
    ownerId: 'owner-004',
    ownerName: 'Lê Hoàng Đức',
    ownerEmail: 'duc.le@example.com',
    ownerPhone: '0000 000 008',
    status: 'approved',
    fields: makeFields().map((f) => ({ ...f, verification: 'matched' as const })),
    rejectedReason: null,
    rejectedAt: null,
    approvedAt: '2026-05-08T11:00:00.000Z',
    submittedAt: '2026-05-07T08:00:00.000Z',
    createdAt: '2026-05-06T08:00:00.000Z',
    updatedAt: '2026-05-08T11:00:00.000Z',
  },
];

const store = new Map<string, KycAdminSubmission>(SEED.map((s) => [s.id, s]));

export class MockKycAdminRepository implements KycAdminRepository {
  async list(filters?: KycAdminFilters): Promise<KycAdminListResult> {
    const filter: KycQueueFilter = filters?.filter ?? 1;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    let arr = Array.from(store.values()).filter((s) =>
      matchesFilter(s.status, filter),
    );
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      arr = arr.filter(
        (s) =>
          s.ownerName.toLowerCase().includes(q) ||
          s.ownerEmail.toLowerCase().includes(q) ||
          s.ownerPhone.includes(q),
      );
    }
    arr.sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
    const pendingCount = Array.from(store.values()).filter((s) =>
      matchesFilter(s.status, 1),
    ).length;
    const start = (page - 1) * pageSize;
    return {
      filter,
      pendingCount,
      total: arr.length,
      page,
      pageSize,
      items: arr.slice(start, start + pageSize),
    };
  }

  async getById(id: string): Promise<KycAdminSubmission | null> {
    return store.get(id) ?? null;
  }

  async approve(input: ApproveKycInput): Promise<KycAdminSubmission> {
    const s = store.get(input.submissionId);
    if (!s) throw new NotFoundError('Không tìm thấy hồ sơ KYC');
    const updated: KycAdminSubmission = {
      ...s,
      status: 'approved',
      approvedAt: new Date().toISOString(),
      rejectedReason: null,
      rejectedAt: null,
      fields: s.fields.map((f) => ({ ...f, verification: 'matched' })),
      updatedAt: new Date().toISOString(),
    };
    store.set(input.submissionId, updated);
    return updated;
  }

  async reject(input: RejectKycInput): Promise<KycAdminSubmission> {
    const s = store.get(input.submissionId);
    if (!s) throw new NotFoundError('Không tìm thấy hồ sơ KYC');
    const updated: KycAdminSubmission = {
      ...s,
      status: 'rejected',
      rejectedReason: input.reason,
      rejectedAt: new Date().toISOString(),
      approvedAt: null,
      updatedAt: new Date().toISOString(),
    };
    store.set(input.submissionId, updated);
    return updated;
  }

  async countPending(): Promise<number> {
    return Array.from(store.values()).filter((s) =>
      matchesFilter(s.status, 1),
    ).length;
  }
}
