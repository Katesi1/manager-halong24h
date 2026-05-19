import type {
  CreateStaffInviteInput,
  StaffFilters,
  StaffInvite,
  StaffInviteFilters,
  StaffMember,
} from '@/core/entities/staff';

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
}
