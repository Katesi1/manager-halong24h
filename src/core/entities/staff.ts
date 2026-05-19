/**
 * Staff (SALE) management — API spec §9.
 *
 * OWNER mời SALE qua email, gửi link `inviteLink + shortCode`. SALE accept
 * tạo account role=2 và tự gán `ownerId` về OWNER mời.
 */

export type StaffInviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface StaffInvite {
  id: string;
  email: string;
  shortCode: string;
  status: StaffInviteStatus;
  expiresAt: string;
  createdAt: string;
  /** Chỉ có khi tạo (POST /staff/invites) — server-generated */
  inviteLink?: string;
  /** Email service đã gửi mail thành công? */
  emailSent?: boolean;
}

export interface CreateStaffInviteInput {
  email: string;
}

export interface StaffInviteFilters {
  status?: StaffInviteStatus | 'all';
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface StaffFilters {
  isActive?: boolean;
}

export const STAFF_INVITE_STATUS_LABEL: Record<StaffInviteStatus, string> = {
  pending: 'Đang chờ',
  accepted: 'Đã chấp nhận',
  expired: 'Hết hạn',
  cancelled: 'Đã huỷ',
};
