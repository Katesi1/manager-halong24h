import 'server-only';

import { NotFoundError } from '@/core/errors';
import type {
  CreateStaffInviteInput,
  StaffFilters,
  StaffInvite,
  StaffInviteFilters,
  StaffMember,
} from '@/core/entities/staff';
import type { StaffRepository } from '@/application/ports/staff-repository';

const invites = new Map<string, StaffInvite>();
const staff = new Map<string, StaffMember>([
  [
    'mock-staff-001',
    {
      id: 'mock-staff-001',
      name: 'Phạm Thu Hà',
      email: 'phamthuha@halong24h.local',
      phone: '0912345678',
      isActive: true,
      createdAt: '2026-04-01T08:00:00.000Z',
    },
  ],
]);

function randomShortCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = 'HL-';
  for (let i = 0; i < 6; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return s;
}

export class MockStaffRepository implements StaffRepository {
  async createInvite(input: CreateStaffInviteInput): Promise<StaffInvite> {
    const id = `mock-inv-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const shortCode = randomShortCode();
    const invite: StaffInvite = {
      id,
      email: input.email,
      shortCode,
      status: 'pending',
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      inviteLink: `https://halong24h.com/staff/accept?token=${shortCode}`,
      emailSent: false,
    };
    invites.set(id, invite);
    return invite;
  }

  async listInvites(filters?: StaffInviteFilters): Promise<StaffInvite[]> {
    let arr = Array.from(invites.values());
    if (filters?.status && filters.status !== 'all') {
      arr = arr.filter((i) => i.status === filters.status);
    }
    return arr.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async cancelInvite(id: string): Promise<void> {
    const inv = invites.get(id);
    if (!inv) throw new NotFoundError('Không tìm thấy invite');
    invites.set(id, { ...inv, status: 'cancelled' });
  }

  async listStaff(filters?: StaffFilters): Promise<StaffMember[]> {
    let arr = Array.from(staff.values());
    if (filters?.isActive !== undefined) {
      arr = arr.filter((s) => s.isActive === filters.isActive);
    }
    return arr;
  }

  async removeStaff(userId: string): Promise<void> {
    const s = staff.get(userId);
    if (!s) throw new NotFoundError('Không tìm thấy nhân viên');
    staff.set(userId, { ...s, isActive: false });
  }
}
