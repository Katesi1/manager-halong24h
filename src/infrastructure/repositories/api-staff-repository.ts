import 'server-only';

import type {
  CreateStaffInviteInput,
  StaffFilters,
  StaffInvite,
  StaffInviteFilters,
  StaffMember,
} from '@/core/entities/staff';
import type { AuthTokens } from '@/core/entities/user';
import type {
  AcceptStaffInviteInput,
  StaffInviteVerification,
  StaffRepository,
} from '@/application/ports/staff-repository';

import { apiClient } from '../http/api-client';

export class ApiStaffRepository implements StaffRepository {
  async createInvite(input: CreateStaffInviteInput): Promise<StaffInvite> {
    // Spec response: { invite, inviteLink, emailSent }
    const data = await apiClient.post<{
      invite: StaffInvite;
      inviteLink: string;
      emailSent: boolean;
    }>('/staff/invites', input);
    return {
      ...data.invite,
      inviteLink: data.inviteLink,
      emailSent: data.emailSent,
    };
  }

  async listInvites(filters?: StaffInviteFilters): Promise<StaffInvite[]> {
    return apiClient.get<StaffInvite[]>('/staff/invites', {
      query: { status: filters?.status },
      cache: 'no-store',
    });
  }

  async cancelInvite(id: string): Promise<void> {
    await apiClient.delete(`/staff/invites/${id}`);
  }

  async listStaff(filters?: StaffFilters): Promise<StaffMember[]> {
    return apiClient.get<StaffMember[]>('/staff', {
      query: { isActive: filters?.isActive },
      cache: 'no-store',
    });
  }

  async removeStaff(userId: string): Promise<void> {
    await apiClient.delete(`/staff/${userId}`);
  }

  async verifyInvite(token: string): Promise<StaffInviteVerification> {
    // Shape thật (spec §11.2 + §26.5): { email, owner:{name,avatar,homestayName},
    // status, expiresAt, scope }. Map phẳng + đọc tolerant field legacy phẳng.
    const raw = await apiClient.get<{
      email?: string;
      owner?: { name?: string; avatar?: string | null; homestayName?: string | null };
      ownerName?: string;
      status?: StaffInviteVerification['status'];
      expiresAt?: string;
      scope?: 'owner' | 'system';
    }>(`/staff/invites/verify/${encodeURIComponent(token)}`, {
      skipAuth: true,
      cache: 'no-store',
    });
    return {
      email: raw.email ?? '',
      ownerName: raw.owner?.name ?? raw.ownerName ?? '',
      ownerAvatar: raw.owner?.avatar ?? null,
      homestayName: raw.owner?.homestayName ?? null,
      status: raw.status ?? 'pending',
      expiresAt: raw.expiresAt ?? '',
      scope: raw.scope,
    };
  }

  async acceptInvite(input: AcceptStaffInviteInput): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/staff/invites/accept', input, {
      skipAuth: true,
    });
  }
}
