import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listAdminUsersAction } from '@/app/actions/admin-users';
import { getPermissionsAction } from '@/app/actions/permissions';
import { RoleCode, isAdmin } from '@/core/value-objects/role';

/**
 * BFF route (ADMIN) — phân quyền. Có `userId` → ma trận quyền của user;
 * không có → danh sách SALE để chọn.
 */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const userId = new URL(request.url).searchParams.get('userId') ?? '';

  if (userId) {
    const res = await getPermissionsAction(userId);
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: 502 });
    }
    const userListRes = await listAdminUsersAction({});
    const user = userListRes.ok
      ? userListRes.data.find((u) => u.id === userId)
      : null;
    return NextResponse.json({
      data: {
        mode: 'edit' as const,
        permissions: res.data.permissions,
        scope: res.data.scope,
        userName: user?.name ?? null,
        userLabel: user ? `${user.name} (${user.email})` : userId,
      },
    });
  }

  const usersRes = await listAdminUsersAction({ role: RoleCode.SALE });
  if (!usersRes.ok) {
    return NextResponse.json({ error: usersRes.error }, { status: 502 });
  }
  return NextResponse.json({
    data: { mode: 'list' as const, saleUsers: usersRes.data },
  });
}
