import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import {
  getYachtConversationAction,
  listYachtMessagesAction,
} from '@/app/actions/yacht-conversations';
import { canManageYachts } from '@/lib/yacht-access';

/**
 * BFF (ADMIN + SALE hệ thống) — chi tiết 1 hội thoại du thuyền + tin nhắn (B3).
 * Client poll route này để cập nhật (ADMIN/SALE hệ thống không nhận WS).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !canManageYachts(profile)) {
    return NextResponse.json({ error: 'Không có quyền' }, { status: 401 });
  }
  const { id } = await params;
  const [conv, msgs] = await Promise.all([
    getYachtConversationAction(id),
    listYachtMessagesAction(id),
  ]);
  if (!conv.ok) {
    return NextResponse.json({ error: conv.error }, { status: 502 });
  }
  if (!conv.data) {
    return NextResponse.json({ error: 'Không tìm thấy hội thoại' }, { status: 404 });
  }
  return NextResponse.json({
    data: {
      conversation: conv.data,
      messages: msgs.ok ? msgs.data : [],
      currentUserId: profile.id,
    },
  });
}
