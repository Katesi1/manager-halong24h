'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import type {
  Conversation,
  ConversationFilters,
  CreateConversationInput,
  Message,
  MessageListResult,
  SendMessageInput,
} from '@/core/entities/chat';
import { chatRepository } from '@/infrastructure/container';
import { requireAuthenticated } from '@/lib/auth-guard';

import { toResult } from './_helpers';

const AttachmentSchema = z.object({
  url: z.string().url().startsWith('https://'),
  type: z.string().max(100),
  name: z.string().max(255),
  size: z.number().int().nonnegative(),
});

const SendSchema = z
  .object({
    conversationId: z.string().uuid(),
    content: z.string().max(5000),
    attachments: z.array(AttachmentSchema).max(5).optional(),
  })
  .refine(
    (v) => v.content.trim().length > 0 || (v.attachments?.length ?? 0) > 0,
    {
      message: 'Tin nhắn phải có nội dung hoặc đính kèm',
      path: ['content'],
    },
  );

const CreateSchema = z.object({
  type: z.enum(['booking', 'support', 'staff']),
  bookingId: z.string().uuid().optional(),
  subject: z.string().max(200).optional(),
});

const EditSchema = z.object({
  messageId: z.string().uuid(),
  content: z.string().min(1).max(5000),
});

export async function listConversationsAction(filters?: ConversationFilters) {
  return toResult<Conversation[]>(async () => {
    await requireAuthenticated();
    return chatRepository().listConversations(filters);
  });
}

export async function getUnreadCountAction() {
  return toResult<number>(async () => {
    await requireAuthenticated();
    return chatRepository().unreadCount();
  });
}

export async function createConversationAction(input: CreateConversationInput) {
  return toResult<Conversation>(async () => {
    await requireAuthenticated();
    const parsed = CreateSchema.parse(input);
    const conv = await chatRepository().createConversation(parsed);
    revalidatePath('/conversations');
    return conv;
  });
}

export async function getConversationAction(id: string) {
  return toResult<Conversation | null>(async () => {
    await requireAuthenticated();
    return chatRepository().getConversation(id);
  });
}

export async function listMessagesAction(
  conversationId: string,
  cursor?: string,
  limit?: number,
) {
  return toResult<MessageListResult>(async () => {
    await requireAuthenticated();
    return chatRepository().listMessages(conversationId, cursor, limit);
  });
}

export async function sendMessageAction(input: SendMessageInput) {
  return toResult<Message>(async () => {
    await requireAuthenticated();
    const parsed = SendSchema.parse(input);
    const msg = await chatRepository().sendMessage(parsed);
    revalidatePath(`/conversations/${parsed.conversationId}`);
    return msg;
  });
}

export async function markConversationReadAction(conversationId: string) {
  return toResult<void>(async () => {
    await requireAuthenticated();
    await chatRepository().markRead(conversationId);
    revalidatePath(`/conversations/${conversationId}`);
  });
}

export async function editMessageAction(input: {
  messageId: string;
  content: string;
}) {
  return toResult<Message>(async () => {
    await requireAuthenticated();
    const parsed = EditSchema.parse(input);
    return chatRepository().editMessage(parsed.messageId, parsed.content);
  });
}

export async function deleteMessageAction(messageId: string) {
  return toResult<void>(async () => {
    await requireAuthenticated();
    await chatRepository().deleteMessage(messageId);
  });
}
