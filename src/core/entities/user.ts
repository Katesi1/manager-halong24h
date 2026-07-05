import type { RoleCode } from '../value-objects/role';
import type { BankStatus } from './bank-account';

export interface Permission {
  module: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type KycStatus = 'none' | 'pending' | 'approved' | 'rejected';

/** Spec §10.5 / §19. */
export type SubscriptionStatus =
  | 'none'
  | 'trial'
  | 'active'
  | 'past_due'
  | 'cancelled'
  | 'frozen'
  | 'expired'
  | null;

/** Spec v1.4 §10.4 — VNPay loại bỏ. v1.6 thêm casso, sepay. */
export type SubscriptionProvider =
  | 'apple_iap'
  | 'manual_bank'
  | 'manual'
  | 'casso'
  | 'sepay'
  | null;

/**
 * Spec v1.7 §2.3 — Login/register/refresh CHỈ trả tokens, không kèm user.
 * FE phải gọi `GET /auth/profile` sau để lấy user info.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Spec v1.7 §2.3 — Google sign-in lần đầu chưa chọn role: BE trả
 * `isNewUser: true` + profile thô để FE prompt user chọn OWNER/CUSTOMER.
 * (Apple sign-in đã bỏ scope ở Phase 17.)
 */
export interface OAuthNewUserPrompt {
  isNewUser: true;
  googleProfile: {
    email: string;
    name: string;
    avatar: string | null;
    sub: string;
  };
}

export type OAuthSignInResult = AuthTokens | OAuthNewUserPrompt;

export function isOAuthNewUserPrompt(
  r: OAuthSignInResult,
): r is OAuthNewUserPrompt {
  return 'isNewUser' in r && r.isNewUser === true;
}


export interface AuthUser {
  id: string;
  name: string;
  phone: string | null;
  email: string;
  avatar: string | null;
  role: RoleCode;
  ownerId: string | null;
  isActive: boolean;
  emailVerified: boolean;
}

export interface UserProfile extends AuthUser {
  gender: number | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string | null;
  kycBypass: boolean;
  kycStatus: KycStatus;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlanId: string | null;
  subscriptionCycle: 'monthly' | 'yearly' | null;
  subscriptionProvider: SubscriptionProvider;
  subscriptionPriceOverride: number | null;
  subscriptionFrozenAt: string | null;
  subscriptionFrozenReason: string | null;
  trialEndsAt: string | null;
  nextChargeAt: string | null;
  permissions: Permission[];
  /**
   * Thông tin nhận tiền OWNER (spec §2.5 / §3.3, v1.21) — 4 field bank = giá trị
   * ĐÃ DUYỆT (sinh VietQR). `bankStatus` cho biết STK đang chờ duyệt / bị từ chối.
   * Role khác OWNER thường `null`. BE trả sẵn trong `/auth/profile` (cast trực tiếp).
   */
  bankBin?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  bankStatus?: BankStatus | null;
  bankRejectReason?: string | null;
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
