'use client';

import { useActionState, useRef, useEffect } from 'react';
import { sendMessageAction, type ChatActionResult } from '@/app/actions/chat';
import { Textarea } from '@/components/ui/input';
import { SubmitButton } from '@/components/auth/submit-button';

interface Props {
  conversationId: string;
}

export function MessageComposer({ conversationId }: Props) {
  const [state, formAction] = useActionState<ChatActionResult, FormData>(sendMessageAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

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
