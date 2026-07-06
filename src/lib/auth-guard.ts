import 'server-only';

import { redirect } from 'next/navigation';

import { getCurrentProfile } from '@/app/actions/auth';
import { ForbiddenError, NotFoundError, UnauthorizedError } from '@/core/errors';
import type { UserProfile } from '@/core/entities/user';
import type { Booking } from '@/core/entities/booking';
import { bookingRepository, propertyRepository } from '@/infrastructure/container';
import { RoleCode, isAdmin, isManagerRole } from '@/core/value-objects/role';

/**
 * Server-side auth guards — gọi trong Server Component (layout, page) hoặc Server Action.
 *
 * Quy tắc chung:
 *  - Đọc profile từ session cookie.
 *  - Nếu chưa login → redirect /login.
 *  - Nếu sai role → throw ForbiddenError (UI layout có thể catch để render màn Forbidden).
 *
 * Defense-in-depth: BE đã có @Roles() guard ở mọi endpoint. Đây là lớp FE đảm bảo
 * user không thấy page mà họ không có quyền — kể cả khi attacker manipulate client JS.
 */
export async function requireProfile(): Promise<UserProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/login');
  }
  return profile;
}

/** Yêu cầu user là ADMIN/OWNER/SALE (chặn CUSTOMER). */
export async function requireManagerRole(): Promise<UserProfile> {
  const profile = await requireProfile();
  if (!isManagerRole(profile.role)) {
    throw new ForbiddenError('Trang này chỉ dành cho tài khoản quản lý');
  }
  return profile;
}

/** Yêu cầu user là ADMIN (chặn OWNER, SALE, CUSTOMER). */
export async function requireAdmin(): Promise<UserProfile> {
  const profile = await requireProfile();
  if (!isAdmin(profile.role)) {
    throw new ForbiddenError(
      'Tính năng này chỉ dành cho tài khoản ADMIN của Halong24h',
    );
  }
  return profile;
}

/** Yêu cầu user là OWNER (cho action chỉ chủ nhà mới được, không SALE). */
export async function requireOwner(): Promise<UserProfile> {
  const profile = await requireProfile();
  if (profile.role !== RoleCode.OWNER && !isAdmin(profile.role)) {
    throw new ForbiddenError('Chỉ chủ nhà (OWNER) được thực hiện');
  }
  return profile;
}

/**
 * Đảm bảo current user là chính chủ của resource (có ownerId).
 * ADMIN bypass — vào được mọi resource.
 */
export async function requireOwnerOf(resourceOwnerId: string): Promise<UserProfile> {
  const profile = await requireProfile();
  if (isAdmin(profile.role)) return profile;
  const myOwnerId =
    profile.role === RoleCode.OWNER ? profile.id : profile.ownerId;
  if (myOwnerId !== resourceOwnerId) {
    throw new ForbiddenError('Bạn không có quyền truy cập tài nguyên này');
  }
  return profile;
}

/** Throw nếu cookie không có hoặc invalid. Dùng cho Server Action không thuộc layout. */
export async function requireAuthenticated(): Promise<UserProfile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new UnauthorizedError();
  return profile;
}

/**
 * Đảm bảo user là chính chủ của property (hoặc ADMIN).
 *
 * - Đầu tiên đảm bảo user là manager role (ADMIN/OWNER/SALE).
 * - ADMIN luôn pass.
 * - OWNER/SALE: load property và so sánh ownerId với (profile.id cho OWNER, profile.ownerId cho SALE).
 *
 * Throw NotFoundError nếu property không tồn tại. Throw ForbiddenError nếu user không sở hữu.
 */
export async function requireOwnerOfProperty(
  propertyId: string,
): Promise<UserProfile> {
  const profile = await requireManagerRole();
  if (isAdmin(profile.role)) return profile;
  const property = await propertyRepository().getById(propertyId);
  if (!property) throw new NotFoundError('Không tìm thấy cơ sở');
  const myOwnerId =
    profile.role === RoleCode.OWNER ? profile.id : profile.ownerId;
  if (!myOwnerId || property.ownerId !== myOwnerId) {
    throw new ForbiddenError('Bạn không có quyền truy cập cơ sở này');
  }
  return profile;
}

/**
 * Đảm bảo current user sở hữu booking (qua cơ sở của booking) — hoặc ADMIN.
 * Trả kèm `booking` đã fetch để caller tái sử dụng (tránh fetch 2 lần ở read).
 * ADMIN bypass. OWNER/SALE: booking.propertyId phải thuộc owner của họ.
 */
export async function requireOwnerOfBooking(
  bookingId: string,
): Promise<{ profile: UserProfile; booking: Booking }> {
  const profile = await requireManagerRole();
  if (!bookingId) throw new NotFoundError('Không tìm thấy đặt phòng');
  const booking = await bookingRepository().getById(bookingId);
  if (!booking) throw new NotFoundError('Không tìm thấy đặt phòng');
  if (isAdmin(profile.role)) return { profile, booking };
  const property = await propertyRepository().getById(booking.propertyId);
  const myOwnerId =
    profile.role === RoleCode.OWNER ? profile.id : profile.ownerId;
  if (!property || !myOwnerId || property.ownerId !== myOwnerId) {
    throw new ForbiddenError('Bạn không có quyền với đặt phòng này');
  }
  return { profile, booking };
}
