import 'server-only';

import type {
  AdminUser,
  AdminUserFilters,
  AdminUserStatus,
  BanUserInput,
  RevokeSessionInput,
  SetKycBypassInput,
  UnbanUserInput,
  UpdateRoleInput,
  UpdateSubscriptionInput,
} from '@/core/entities/admin-user';
import type { AdminUserRepository } from '@/application/ports/admin-user-repository';
import type { RoleCode } from '@/core/value-objects/role';

import { apiClient } from '../http/api-client';

/**
 * Spec §3 + v1.3 §22 A2 — `GET /users?withStats=true` bundle `propertyCount`,
 * `bookingCount`, `stats.disputeCount` + `lastActiveAt` (null nếu user chỉ dùng
 * web — `lastActiveAt` chỉ track từ mobile FCM).
 */
interface SpecUserWithStats {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar?: string | null;
  role: RoleCode;
  ownerId: string | null;
  /** Spec §26 — `owner` (SALE thuộc chủ nhà) | `system` (Sale hệ thống). */
  scope?: 'owner' | 'system' | null;
  isActive: boolean;
  emailVerified?: boolean;
  bannedAt?: string | null;
  bannedReason?: string | null;
  kycStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  kycBypass?: boolean;
  subscriptionStatus?: string | null;
  subscriptionPlanId?: string | null;
  subscriptionCycle?: 'monthly' | 'yearly' | null;
  createdAt: string;
  updatedAt?: string;
  propertyCount?: number;
  bookingCount?: number;
  stats?: { disputeCount?: number } | null;
  lastActiveAt?: string | null;
}

function mapStatus(s: SpecUserWithStats): AdminUserStatus {
  if (s.bannedAt) return 'banned';
  if (!s.isActive) return 'suspended';
  return 'active';
}

function mapPlan(s: SpecUserWithStats): AdminUser['subscriptionPlan'] {
  const id = s.subscriptionPlanId;
  if (!id) return null;
  if (id.startsWith('rooms_1')) return 'free';
  if (id.startsWith('rooms_5')) return 'basic';
  if (id.startsWith('rooms_10')) return 'standard';
  return 'pro';
}

function mapUser(s: SpecUserWithStats): AdminUser {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone,
    role: s.role,
    status: mapStatus(s),
    ownerId: s.ownerId,
    scope: s.scope ?? null,
    bookingCount: s.bookingCount ?? 0,
    propertyCount: s.propertyCount ?? 0,
    disputeCount: s.stats?.disputeCount ?? 0,
    kycStatus: s.kycStatus ?? 'none',
    kycBypass: s.kycBypass ?? false,
    subscriptionPlan: mapPlan(s),
    createdAt: s.createdAt,
    // `null` cho user chỉ dùng web (chỉ track từ mobile FCM) — giữ nullable.
    lastActiveAt: s.lastActiveAt ?? null,
  };
}

export class ApiAdminUserRepository implements AdminUserRepository {
  async list(filters?: AdminUserFilters): Promise<AdminUser[]> {
    const data = await apiClient.get<
      SpecUserWithStats[] | { items: SpecUserWithStats[] }
    >('/users', {
      query: {
        withStats: 'true',
        role: filters?.role,
        // Spec: `GET /users?q=...` search name/phone/email (BE tự trim + cap 100).
        q: filters?.search,
        ownerId: filters?.ownerId,
        kycStatus: filters?.kycStatus,
        // Spec §26.3.2 — lọc SALE theo scope server-side (BE tự ép role=2).
        scope: filters?.scope,
      },
      cache: 'no-store',
    });
    const arr = Array.isArray(data) ? data : (data.items ?? []);
    let users = arr.map(mapUser);
    // BE chưa filter status được — filter FE-side.
    if (filters?.status) {
      users = users.filter((u) => u.status === filters.status);
    }
    return users;
  }

  async getById(id: string): Promise<AdminUser | null> {
    try {
      const data = await apiClient.get<SpecUserWithStats>(`/users/${id}`, {
        query: { withStats: 'true' },
        cache: 'no-store',
      });
      return mapUser(data);
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

  async ban(input: BanUserInput): Promise<AdminUser> {
    const data = await apiClient.post<SpecUserWithStats>(
      `/users/${input.userId}/ban`,
      { reason: input.reason },
    );
    return mapUser(data);
  }

  async unban(input: UnbanUserInput): Promise<AdminUser> {
    const data = await apiClient.post<SpecUserWithStats>(
      `/users/${input.userId}/unban`,
    );
    return mapUser(data);
  }

  async updateRole(input: UpdateRoleInput): Promise<AdminUser> {
    // BE: `PATCH /users/:id/role` (KHÔNG prefix /admin) body `{ role: number }`.
    // Trả user đã cập nhật — re-fetch kèm withStats để giữ đủ thống kê.
    await apiClient.patch(`/users/${input.userId}/role`, {
      role: input.role,
    });
    const refreshed = await this.getById(input.userId);
    if (!refreshed)
      throw new Error('Không tìm thấy user sau khi đổi vai trò');
    return refreshed;
  }

  async setKycBypass(input: SetKycBypassInput): Promise<AdminUser> {
    // Spec §2A.7 — `PATCH /users/:id/kyc-bypass` body `{ bypass }`. Re-fetch
    // kèm withStats để giữ đủ thống kê + trạng thái kycBypass mới.
    await apiClient.patch(`/users/${input.userId}/kyc-bypass`, {
      bypass: input.bypass,
    });
    const refreshed = await this.getById(input.userId);
    if (!refreshed)
      throw new Error('Không tìm thấy user sau khi cập nhật quyền KYC');
    return refreshed;
  }

  async revokeSession(input: RevokeSessionInput): Promise<void> {
    await apiClient.post(`/users/${input.userId}/revoke-sessions`);
  }

  async updateSubscription(input: UpdateSubscriptionInput): Promise<AdminUser> {
    // Spec §10.4: subscription update qua `/admin/users/:id/subscription/*`.
    // FE chỉ truyền `plan` (rooms tier) — BE compute price + apply.
    // Convert plan → planId theo convention spec v1.3 A4 (rooms_X prefix).
    const planId: Record<typeof input.plan, string> = {
      free: 'rooms_1',
      basic: 'rooms_5',
      standard: 'rooms_10',
      pro: 'rooms_30',
    };
    await apiClient.patch(
      `/admin/users/${input.userId}/subscription/price`,
      { planId: planId[input.plan] },
    );
    const refreshed = await this.getById(input.userId);
    if (!refreshed)
      throw new Error('Không tìm thấy user sau khi cập nhật subscription');
    return refreshed;
  }

  async resetPassword(userId: string): Promise<void> {
    await apiClient.post(`/users/${userId}/reset-password`);
  }
}
