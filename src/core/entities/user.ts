import type { RoleCode } from '../value-objects/role';

export interface Permission {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'cancelled'
  | 'expired'
  | null;

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface AuthUser {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  role: RoleCode;
  ownerId: string | null;
  isActive: boolean;
}

export interface UserProfile extends AuthUser {
  gender: number | null;
  dateOfBirth: string | null;
  createdAt: string;
  kycBypass: boolean;
  kycStatus: KycStatus;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlanId: string | null;
  subscriptionCycle: 'monthly' | 'yearly' | null;
  trialEndsAt: string | null;
  nextChargeAt: string | null;
  permissions: Permission[];
}

export function findPermission(
  profile: Pick<UserProfile, 'permissions' | 'role'>,
  module: string,
): Permission | null {
  return profile.permissions.find((p) => p.module === module) ?? null;
}

export function canAccess(
  profile: Pick<UserProfile, 'permissions' | 'role'>,
  module: string,
  action: 'create' | 'read' | 'update' | 'delete',
): boolean {
  if (profile.role === 0) return true;
  const p = findPermission(profile, module);
  if (!p) return false;
  switch (action) {
    case 'create':
      return p.canCreate;
    case 'read':
      return p.canRead;
    case 'update':
      return p.canUpdate;
    case 'delete':
      return p.canDelete;
  }
}
