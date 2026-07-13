'use server';

import { z } from 'zod';

import type { Conversation, Message } from '@/core/entities/chat';
import { NotFoundError } from '@/core/errors';
import { chatRepository } from '@/infrastructure/container';
import { requireYachtManager } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Spec B3 — hội thoại du thuyền khách ↔ hệ thống.
 * ADMIN + SALE hệ thống đọc/gửi được MỌI hội thoại yacht dù không phải thành
 * viên → dùng guard `requireYachtManager` + gọi thẳng repo (KHÔNG qua
 * `requireConversationMember` như chat thường, vì SALE hệ thống không là member).
 */
const FiltersSchema = z
  .object({
    customerId: z.string().uuid('Mã khách không hợp lệ').optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(100).optional(),
  })
  .optional();

const UuidSchema = z.string().uuid('Mã hội thoại không hợp lệ');

const SendSchema = z.object({
  conversationId: z.string().uuid('Mã hội thoại không hợp lệ'),
  content: z.string().trim().min(1, 'Nội dung không được trống').max(5000),
});

export async function listYachtConversationsAction(filters?: {
  customerId?: string;
  page?: number;
  limit?: number;
}) {
  return toResult<Conversation[]>(async () => {
    await requireYachtManager();
    const parsed = FiltersSchema.parse(filters);
    return chatRepository().listYachtConversations(parsed);
  });
}

export async function getYachtConversationAction(id: string) {
  return toResult<Conversation | null>(async () => {
    await requireYachtManager();
    return chatRepository().getConversation(UuidSchema.parse(id));
  });
}

export async function listYachtMessagesAction(conversationId: string) {
  return toResult<Message[]>(async () => {
    await requireYachtManager();
    const res = await chatRepository().listMessages(
      UuidSchema.parse(conversationId),
      undefined,
      100,
    );
    return res.items;
  });
}

export async function sendYachtMessageAction(input: {
  conversationId: string;
  content: string;
}) {
  return toResult<Message>(async () => {
    await requireYachtManager();
    const parsed = SendSchema.parse(input);
    const conv = await chatRepository().getConversation(parsed.conversationId);
    if (!conv) throw new NotFoundError('Không tìm thấy hội thoại');
    return chatRepository().sendMessage({
      conversationId: parsed.conversationId,
      content: parsed.content,
    });
  });
}
