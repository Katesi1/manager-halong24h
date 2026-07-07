import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import { listConversationsAction } from '@/app/actions/conversations';
import type { Conversation as SpecConversation } from '@/core/entities/chat';
import { isManagerRole } from '@/core/value-objects/role';

function adaptConversation(c: SpecConversation, currentUserId: string | null) {
  const customer = c.members.find((m) => m.role === 'customer');
  return {
    id: c.id,
    property_name: c.subject ?? '',
    property_short: c.propertyId ? c.propertyId.slice(0, 6) : '—',
    customer_name: customer?.user.name ?? 'Khách',
    last_message_preview: c.lastMessagePreview ?? '',
    last_message_from_me:
      currentUserId !== null && c.lastSenderId === currentUserId,
    last_message_at: c.lastMessageAt ?? c.createdAt,
    unread_owner: c.myUnread,
    online: false,
  };
}

/** BFF route (host) — danh sách hội thoại (đã adapt sang shape UI). */
export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const res = await listConversationsAction();
  if (!res.ok) {
    return NextResponse.json({ error: res.error }, { status: 502 });
  }
  return NextResponse.json({
    data: res.data.map((c) => adaptConversation(c, profile.id ?? null)),
  });
}
