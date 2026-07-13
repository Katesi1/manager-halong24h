import { redirect } from 'next/navigation';

import { getCurrentProfile } from '@/app/actions/auth';
import { isAdmin } from '@/core/value-objects/role';
import { isSystemSale } from '@/lib/yacht-access';

/**
 * Manager root — auto-detect role và redirect:
 *  - Chưa login → /login
 *  - ADMIN → /admin
 *  - OWNER / SALE → /host
 *  - CUSTOMER (bị chặn) → /login (vì /host layout sẽ render forbidden)
 */
export default async function ManagerRoot() {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect('/login?redirect=/');
  }
  if (isAdmin(profile.role)) {
    redirect('/admin');
  }
  // SALE hệ thống → mảng du thuyền (họ không có nghiệp vụ host).
  if (isSystemSale(profile)) {
    redirect('/admin/yachts');
  }
  redirect('/host');
}
