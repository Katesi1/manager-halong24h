import 'server-only';

import { NotFoundError } from '@/core/errors';
import type {
  AdminUser,
  AdminUserFilters,
  BanUserInput,
  RevokeSessionInput,
  UnbanUserInput,
  UpdateSubscriptionInput,
} from '@/core/entities/admin-user';
import type { AdminUserRepository } from '@/application/ports/admin-user-repository';
import { RoleCode } from '@/core/value-objects/role';

const SEED: AdminUser[] = [
  // Owners
  {
    id: 'owner-001',
    name: 'Nguyễn Văn An',
    email: 'owner1@example.com',
    phone: '0912345678',
    role: RoleCode.OWNER,
    status: 'active',
    ownerId: null,
    bookingCount: 28,
    propertyCount: 3,
    disputeCount: 0,
    kycStatus: 'pending',
    subscriptionPlan: 'basic',
    createdAt: '2026-03-12T08:00:00.000Z',
    lastActiveAt: '2026-05-15T10:30:00.000Z',
  },
  {
    id: 'owner-002',
    name: 'Trần Thị Bình',
    email: 'binh.tran@example.com',
    phone: '0987654321',
    role: RoleCode.OWNER,
    status: 'active',
    ownerId: null,
    bookingCount: 12,
    propertyCount: 1,
    disputeCount: 1,
    kycStatus: 'pending',
    subscriptionPlan: 'free',
    createdAt: '2026-04-20T08:00:00.000Z',
    lastActiveAt: '2026-05-15T18:00:00.000Z',
  },
  {
    id: 'owner-003',
    name: 'Phạm Hữu Cường',
    email: 'cuong.pham@example.com',
    phone: '0901234567',
    role: RoleCode.OWNER,
    status: 'active',
    ownerId: null,
    bookingCount: 5,
    propertyCount: 1,
    disputeCount: 0,
    kycStatus: 'rejected',
    subscriptionPlan: 'free',
    createdAt: '2026-05-01T08:00:00.000Z',
    lastActiveAt: '2026-05-15T20:00:00.000Z',
  },
  {
    id: 'owner-004',
    name: 'Lê Hoàng Đức',
    email: 'duc.le@example.com',
    phone: '0988111222',
    role: RoleCode.OWNER,
    status: 'active',
    ownerId: null,
    bookingCount: 145,
    propertyCount: 8,
    disputeCount: 2,
    kycStatus: 'approved',
    subscriptionPlan: 'standard',
    createdAt: '2025-11-15T08:00:00.000Z',
    lastActiveAt: '2026-05-15T22:00:00.000Z',
  },
  // Sales (thuộc owner-001)
  {
    id: 'sale-001',
    name: 'Phạm Thu Hà',
    email: 'thuha@example.com',
    phone: '0915566778',
    role: RoleCode.SALE,
    status: 'active',
    ownerId: 'owner-001',
    bookingCount: 18,
    propertyCount: 0,
    disputeCount: 0,
    kycStatus: 'none',
    subscriptionPlan: null,
    createdAt: '2026-04-01T08:00:00.000Z',
    lastActiveAt: '2026-05-15T14:00:00.000Z',
  },
  {
    id: 'sale-002',
    name: 'Đỗ Minh Tâm',
    email: 'tam.do@example.com',
    phone: '0918881111',
    role: RoleCode.SALE,
    status: 'active',
    ownerId: 'owner-004',
    bookingCount: 89,
    propertyCount: 0,
    disputeCount: 0,
    kycStatus: 'none',
    subscriptionPlan: null,
    createdAt: '2026-01-10T08:00:00.000Z',
    lastActiveAt: '2026-05-15T19:00:00.000Z',
  },
  // Customers
  {
    id: 'cus-001',
    name: 'Lê Văn Đức',
    email: 'leduc@example.com',
    phone: '0901234500',
    role: RoleCode.CUSTOMER,
    status: 'active',
    ownerId: null,
    bookingCount: 5,
    propertyCount: 0,
    disputeCount: 0,
    kycStatus: 'none',
    subscriptionPlan: null,
    createdAt: '2025-08-01T08:00:00.000Z',
    lastActiveAt: '2026-05-15T12:00:00.000Z',
  },
  {
    id: 'cus-002',
    name: 'Nguyễn Hữu Cường',
    email: 'cuong.nh@example.com',
    phone: '0977000111',
    role: RoleCode.CUSTOMER,
    status: 'banned',
    ownerId: null,
    bookingCount: 1,
    propertyCount: 0,
    disputeCount: 1,
    kycStatus: 'none',
    subscriptionPlan: null,
    createdAt: '2025-12-01T08:00:00.000Z',
    lastActiveAt: '2025-12-09T10:00:00.000Z',
  },
  {
    id: 'cus-003',
    name: 'Phạm Thúy Linh',
    email: 'linh.pham@example.com',
    phone: '0912340000',
    role: RoleCode.CUSTOMER,
    status: 'active',
    ownerId: null,
    bookingCount: 7,
    propertyCount: 0,
    disputeCount: 0,
    kycStatus: 'none',
    subscriptionPlan: null,
    createdAt: '2024-11-10T08:00:00.000Z',
    lastActiveAt: '2026-05-10T08:00:00.000Z',
  },
];

const store = new Map<string, AdminUser>(SEED.map((u) => [u.id, u]));

export class MockAdminUserRepository implements AdminUserRepository {
  async list(filters?: AdminUserFilters): Promise<AdminUser[]> {
    let arr = Array.from(store.values());
    if (filters?.role !== undefined)
      arr = arr.filter((u) => u.role === filters.role);
    if (filters?.status) arr = arr.filter((u) => u.status === filters.status);
    if (filters?.kycStatus)
      arr = arr.filter((u) => u.kycStatus === filters.kycStatus);
    if (filters?.ownerId) arr = arr.filter((u) => u.ownerId === filters.ownerId);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      arr = arr.filter(
        (u) =>
          u.id.toLowerCase().includes(q) ||
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone ?? '').includes(q),
      );
    }
    return arr.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getById(id: string): Promise<AdminUser | null> {
    return store.get(id) ?? null;
  }

  async ban(input: BanUserInput): Promise<AdminUser> {
    const u = store.get(input.userId);
    if (!u) throw new NotFoundError('Không tìm thấy người dùng');
    const updated = { ...u, status: 'banned' as const };
    store.set(input.userId, updated);
    return updated;
  }

  async unban(input: UnbanUserInput): Promise<AdminUser> {
    const u = store.get(input.userId);
    if (!u) throw new NotFoundError('Không tìm thấy người dùng');
    const updated = { ...u, status: 'active' as const };
    store.set(input.userId, updated);
    return updated;
  }

  async revokeSession(_input: RevokeSessionInput): Promise<void> {
    // Mock: chỉ log, không thay đổi store
  }

  async updateSubscription(
    input: UpdateSubscriptionInput,
  ): Promise<AdminUser> {
    const u = store.get(input.userId);
    if (!u) throw new NotFoundError('Không tìm thấy người dùng');
    const updated = { ...u, subscriptionPlan: input.plan };
    store.set(input.userId, updated);
    return updated;
  }

  async resetPassword(_userId: string): Promise<void> {
    // Mock: chỉ giả lập, không thay đổi store
  }
}
