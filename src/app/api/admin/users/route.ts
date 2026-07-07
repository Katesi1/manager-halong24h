import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listAdminUsersAction } from '@/app/actions/admin-users';
import type { AdminUserStatus } from '@/core/entities/admin-user';
import { RoleCode, isAdmin } from '@/core/value-objects/role';

const ROLE_FROM_TAB: Record<string, RoleCode | undefined> = {
  customer: RoleCode.CUSTOMER,
  owner: RoleCode.OWNER,
  sale: RoleCode.SALE,
  admin: RoleCode.ADMIN,
};

/** BFF route (ADMIN) — người dùng (filter role/status/search server-side). */
export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const sp = new URL(request.url).searchParams;
  const roleParam = sp.get('role') ?? '';
  const statusParam = sp.get('status') ?? '';
  const status: AdminUserStatus | undefined =
    statusParam === 'active' ||
    statusParam === 'suspended' ||
    statusParam === 'banned'
      ? statusParam
      : undefined;

  const result = await listAdminUsersAction({
    role: ROLE_FROM_TAB[roleParam],
    status,
    search: sp.get('q') ?? undefined,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }
  return NextResponse.json({ data: result.data });
}
