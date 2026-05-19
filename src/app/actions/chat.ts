'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

/**
 * Legacy chat — BE chưa có endpoint /messages. Action mock-success.
 */
const messageSchema = z.object({
  conversation_id: z.string().min(1),
  content: z.string().min(1, 'Tin nhắn không được trống').max(5000),
});

export interface ChatActionResult {
  ok?: boolean;
  error?: string;
}

export async function sendMessageAction(
  _prev: ChatActionResult,
  formData: FormData,
): Promise<ChatActionResult> {
  const parsed = messageSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? 'Tin nhắn không hợp lệ',
    };
  }
  revalidatePath(`/messages/${parsed.data.conversation_id}`);
  return { ok: true };
}

export async function startConversationAction(
  propertyId: string,
): Promise<{ ok?: boolean; error?: string; conversationId?: string }> {
  // Mock: trả về conversation id deterministic theo property
  return { ok: true, conversationId: `mock-conv-${propertyId}` };
}

export async function markConversationReadAction(
  _conversationId: string,
  _asRole: 'customer' | 'owner',
): Promise<ChatActionResult> {
  revalidatePath('/host/messages');
  revalidatePath('/my/messages');
  return { ok: true };
}
