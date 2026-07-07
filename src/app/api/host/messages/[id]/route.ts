import { NextResponse } from 'next/server';

import { getCurrentProfile } from '@/app/actions/auth';
import {
  getConversationAction,
  listConversationsAction,
  listMessagesAction,
} from '@/app/actions/conversations';
import type { Conversation as SpecConversation } from '@/core/entities/chat';
import { isManagerRole } from '@/core/value-objects/role';

function customerOf(conv: SpecConversation) {
  return conv.members.find((m) => m.role === 'customer');
}

/**
 * BFF route (host) — chi tiết 1 hội thoại: conversation + danh sách hội thoại +
 * lịch sử tin ban đầu. Tin realtime về sau đi qua WebSocket (`/chat`). Client
 * render layout + `<ChatThread>`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const profile = await getCurrentProfile();
  if (!profile || !isManagerRole(profile.role)) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 });
  }

  const { id } = await params;

  const [convRes, listRes, msgRes] = await Promise.all([
    getConversationAction(id),
    listConversationsAction(),
    listMessagesAction(id, undefined, 50),
  ]);

  if (!convRes.ok || !convRes.data) {
    return NextResponse.json(
      { error: 'Không tìm thấy hội thoại' },
      { status: 404 },
    );
  }

  const conv = convRes.data;

  return NextResponse.json({
    data: {
      conv,
      allConvs: listRes.ok ? listRes.data : [],
      currentUserId: profile.id,
      peerUserId: customerOf(conv)?.userId ?? null,
      initialMessages: msgRes.ok ? msgRes.data.items : [],
      initialNextCursor: msgRes.ok ? msgRes.data.nextCursor : null,
    },
  });
}
