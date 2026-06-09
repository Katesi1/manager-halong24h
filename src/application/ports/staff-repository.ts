import type {
  CreateStaffInviteInput,
  StaffFilters,
  StaffInvite,
  StaffInviteFilters,
  StaffMember,
} from '@/core/entities/staff';
import type { AuthTokens } from '@/core/entities/user';

/** Spec §11.2 — info hiển thị trên landing accept invite. */
export interface StaffInviteVerification {
  token: string;
  email: string;
  ownerName: string;
  ownerEmail: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expiresAt: string;
}

/** Spec §11.2 — body POST /staff/invites/accept. */
export interface AcceptStaffInviteInput {
  token: string;
  method: 'google' | 'password';
  idToken?: string;
  name?: string;
  password?: string;
  phone?: string;
}

export interface StaffRepository {
  /** POST /staff/invites */
  createInvite(input: CreateStaffInviteInput): Promise<StaffInvite>;
  /** GET /staff/invites?status= */
  listInvites(filters?: StaffInviteFilters): Promise<StaffInvite[]>;
  /** DELETE /staff/invites/:id (chỉ pending) */
  cancelInvite(id: string): Promise<void>;

  /** GET /staff?isActive= */
  listStaff(filters?: StaffFilters): Promise<StaffMember[]>;
  /** DELETE /staff/:userId */
  removeStaff(userId: string): Promise<void>;

  /** Public — GET /staff/invites/verify/:token (token đầy đủ hoặc HL-XXXXXX). */
  verifyInvite(token: string): Promise<StaffInviteVerification>;
  /**
   * Public — POST /staff/invites/accept. Spec v1.7: chỉ trả tokens, caller phải
   * gọi `getProfile()` sau để có user info.
   */
  acceptInvite(input: AcceptStaffInviteInput): Promise<AuthTokens>;
}
