'use client';

import { useActionState, useRef, useEffect } from 'react';
import { sendMessageAction, type ChatActionResult } from '@/app/actions/chat';
import { Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/auth/submit-button';

interface Props {
  conversationId: string;
  isDemo: boolean;
}

export function MessageComposer({ conversationId, isDemo }: Props) {
  const [state, formAction] = useActionState<ChatActionResult, FormData>(sendMessageAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  if (isDemo) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-100">
        ⚠️ Demo mode — chưa thể gửi tin nhắn. Setup Supabase + chạy migration{' '}
        <code className="rounded bg-amber-100 px-1">0006_messaging_notifications.sql</code> để
        kích hoạt chat thật.
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="conversation_id" value={conversationId} />
      <Textarea
        name="content"
        rows={2}
        required
        maxLength={5000}
        placeholder="Soạn tin nhắn..."
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <div className="flex justify-end">
        <SubmitButton pending="Đang gửi...">Gửi tin nhắn</SubmitButton>
      </div>
    </form>
  );
}
