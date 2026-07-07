import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { getEmailServiceStatusAction } from '@/app/actions/admin-emails';
import { isAdmin } from '@/core/value-objects/role';

/** BFF route (ADMIN) — trạng thái email service + danh sách mẫu email. */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isAdmin(profile.role)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }

  const statusResult = await getEmailServiceStatusAction();
  if (!statusResult.ok) {
    return NextResponse.json({ error: statusResult.error }, { status: 502 });
  }
  return NextResponse.json({
    data: {
      profileEmail: profile.email ?? null,
      smtpEnabled: statusResult.data.smtpEnabled,
      templates: statusResult.data.templates,
    },
  });
}
