import 'server-only';

import type {
  BankAccountFilters,
  BankAccountQueueItem,
  BankAccountQueueResult,
  BankAccountState,
  BankDetails,
  BankQueueFilter,
  BankStatus,
  RejectBankInput,
  SubmitBankInput,
} from '@/core/entities/bank-account';
import type { BankAccountRepository } from '@/application/ports/bank-account-repository';

import { apiClient } from '../http/api-client';

/**
 * Tài khoản nhận tiền OWNER — luồng duyệt bởi ADMIN (spec §3.3, v1.21).
 *
 * OWNER: `GET`/`PUT /users/me/bank` → `{ status, current, pending, rejectReason,
 *   submittedAt, reviewedAt }`.
 * ADMIN: `GET /admin/bank-accounts?status&page&limit` → `{ filter, pendingCount,
 *   total, page, limit, items[] }`; approve/reject qua
 *   `POST /admin/users/:id/bank/(approve|reject)`.
 *
 * Mapper tolerant: chấp nhận field thiếu (nested `current`/`pending` có thể null),
 * ép mọi giá trị bank về `string | null`.
 */

interface SpecBankDetails {
  bankBin?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
}

interface SpecBankState {
  status?: string | null;
  current?: SpecBankDetails | null;
  pending?: SpecBankDetails | null;
  rejectReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

interface SpecQueueItem extends SpecBankState {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
}

interface SpecQueueResponse {
  filter?: string;
  pendingCount?: number;
  total?: number;
  page?: number;
  limit?: number;
  items?: SpecQueueItem[];
}

const VALID_STATUS: readonly BankStatus[] = [
  'none',
  'pending',
  'approved',
  'rejected',
];

function mapStatus(s: string | null | undefined): BankStatus {
  return VALID_STATUS.includes(s as BankStatus) ? (s as BankStatus) : 'none';
}

function str(v: string | null | undefined): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function mapDetails(d: SpecBankDetails | null | undefined): BankDetails {
  return {
    bankBin: str(d?.bankBin),
    bankName: str(d?.bankName),
    bankAccountNumber: str(d?.bankAccountNumber),
    bankAccountName: str(d?.bankAccountName),
  };
}

/** `pending` chỉ có nghĩa khi status='pending' → trả null nếu rỗng. */
function mapPending(
  d: SpecBankDetails | null | undefined,
  status: BankStatus,
): BankDetails | null {
  if (status !== 'pending' || !d) return null;
  const details = mapDetails(d);
  const empty =
    !details.bankBin &&
    !details.bankName &&
    !details.bankAccountNumber &&
    !details.bankAccountName;
  return empty ? null : details;
}

function mapState(s: SpecBankState): BankAccountState {
  const status = mapStatus(s.status);
  return {
    status,
    current: mapDetails(s.current),
    pending: mapPending(s.pending, status),
    rejectReason: status === 'rejected' ? str(s.rejectReason) : null,
    submittedAt: s.submittedAt ?? null,
    reviewedAt: s.reviewedAt ?? null,
  };
}

function mapQueueItem(it: SpecQueueItem): BankAccountQueueItem {
  const status = mapStatus(it.status);
  return {
    id: it.id,
    name: it.name ?? '',
    email: it.email ?? '',
    phone: str(it.phone),
    avatar: str(it.avatar),
    status,
    current: mapDetails(it.current),
    pending: mapPending(it.pending, status),
    rejectReason: status === 'rejected' ? str(it.rejectReason) : null,
    submittedAt: it.submittedAt ?? null,
    reviewedAt: it.reviewedAt ?? null,
  };
}

export class ApiBankAccountRepository implements BankAccountRepository {
  async getMine(): Promise<BankAccountState> {
    const data = await apiClient.get<SpecBankState>('/users/me/bank', {
      cache: 'no-store',
    });
    return mapState(data);
  }

  async submitMine(input: SubmitBankInput): Promise<BankAccountState> {
    const data = await apiClient.put<SpecBankState>('/users/me/bank', input);
    return mapState(data);
  }

  async listQueue(
    filters?: BankAccountFilters,
  ): Promise<BankAccountQueueResult> {
    const filter: BankQueueFilter = filters?.filter ?? 'pending';
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 20;
    const data = await apiClient.get<SpecQueueResponse>(
      '/admin/bank-accounts',
      {
        query: { status: filter, page, limit },
        cache: 'no-store',
      },
    );
    const items = (data.items ?? []).map(mapQueueItem);
    return {
      filter: (data.filter as BankQueueFilter) ?? filter,
      pendingCount: data.pendingCount ?? 0,
      total: data.total ?? items.length,
      page: data.page ?? page,
      limit: data.limit ?? limit,
      items,
    };
  }

  async approve(userId: string): Promise<void> {
    await apiClient.post(`/admin/users/${userId}/bank/approve`);
  }

  async reject(input: RejectBankInput): Promise<void> {
    await apiClient.post(`/admin/users/${input.userId}/bank/reject`, {
      reason: input.reason,
    });
  }

  async countPending(): Promise<number> {
    const result = await this.listQueue({ filter: 'pending', page: 1, limit: 1 });
    return result.pendingCount;
  }
}
