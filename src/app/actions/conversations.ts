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
import { CHAT_ATTACHMENT_MAX_COUNT } from '@/core/entities/upload';
import { ForbiddenError, NotFoundError } from '@/core/errors';
import { isAdmin } from '@/core/value-objects/role';
import { chatRepository } from '@/infrastructure/container';
import { requireAuthenticated } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Đảm bảo current user là THÀNH VIÊN của hội thoại (hoặc ADMIN) trước khi đọc
 * dữ liệu — chặn đoán conversationId để xem hội thoại/tin nhắn của người khác.
 * Trả conversation đã fetch để caller tái dùng (getConversation không fetch 2 lần).
 * Write (send/edit/delete) để BE enforce (hot-path, BE authoritative).
 */
async function requireConversationMember(
  conversationId: string,
): Promise<Conversation> {
  const profile = await requireAuthenticated();
  const conv = await chatRepository().getConversation(conversationId);
  if (!conv) throw new NotFoundError('Không tìm thấy hội thoại');
  if (isAdmin(profile.role)) return conv;
  if (!conv.members.some((m) => m.userId === profile.id)) {
    throw new ForbiddenError('Bạn không thuộc hội thoại này');
  }
  return conv;
}

/**
 * Validation chat — đối chiếu spec §17 (Chat REST) + §23 (Uploads).
 *
 * Mọi Server Action là biên vào Application layer ⇒ validate Zod đầy đủ.
 * BE vẫn double-check (authoritative); FE fail-fast để UX rõ + chặn input rác.
 */

const MAX_CONTENT_LEN = 5000;
const MAX_SUBJECT_LEN = 200;
const MAX_PAGE_LIMIT = 100;

/** Spec §17.5 / §23.5 — ràng buộc 1 attachment. */
const AttachmentSchema = z.object({
  url: z
    .string()
    .url('URL đính kèm không hợp lệ')
    .max(2048, 'URL đính kèm quá dài (tối đa 2048 ký tự)')
    .startsWith('https://', 'URL đính kèm phải dùng HTTPS'),
  type: z.string().max(100, 'Loại tệp không hợp lệ'),
  name: z.string().max(255, 'Tên tệp quá dài (tối đa 255 ký tự)'),
  size: z.number().int().nonnegative(),
});

const ConversationMemberRoleEnum = z.enum([
  'owner',
  'sale',
  'customer',
  'admin',
]);

const FiltersSchema = z
  .object({
    role: ConversationMemberRoleEnum.optional(),
    page: z.number().int().positive().optional(),
    limit: z.number().int().positive().max(MAX_PAGE_LIMIT).optional(),
  })
  .optional();

const ListMessagesSchema = z.object({
  conversationId: z.string().uuid('Mã hội thoại không hợp lệ'),
  cursor: z.string().max(255).optional(),
  limit: z.number().int().positive().max(MAX_PAGE_LIMIT).optional(),
});

const SendSchema = z
  .object({
    conversationId: z.string().uuid('Mã hội thoại không hợp lệ'),
    content: z.string().max(MAX_CONTENT_LEN, 'Tin nhắn quá dài (tối đa 5000 ký tự)'),
    attachments: z.array(AttachmentSchema).max(CHAT_ATTACHMENT_MAX_COUNT).optional(),
  })
  .refine(
    (v) => v.content.trim().length > 0 || (v.attachments?.length ?? 0) > 0,
    {
      message: 'Tin nhắn phải có nội dung hoặc đính kèm',
      path: ['content'],
    },
  );

const CreateSchema = z
  .object({
    type: z.enum(['booking', 'support', 'staff']),
    bookingId: z.string().uuid('Mã đặt phòng không hợp lệ').optional(),
    subject: z.string().max(MAX_SUBJECT_LEN).optional(),
  })
  // Spec §17.1 — conversation type "booking" idempotent theo bookingId.
  .refine((v) => v.type !== 'booking' || Boolean(v.bookingId), {
    message: 'Hội thoại theo đặt phòng cần mã đặt phòng',
    path: ['bookingId'],
  });

const EditSchema = z.object({
  messageId: z.string().uuid('Mã tin nhắn không hợp lệ'),
  content: z
    .string()
    .trim()
    .min(1, 'Nội dung không được để trống')
    .max(MAX_CONTENT_LEN, 'Tin nhắn quá dài (tối đa 5000 ký tự)'),
});

const UuidSchema = z.string().uuid('Mã không hợp lệ');

export async function listConversationsAction(filters?: ConversationFilters) {
  return toResult<Conversation[]>(async () => {
    await requireAuthenticated();
    const parsed = FiltersSchema.parse(filters);
    return chatRepository().listConversations(parsed);
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
    const conversationId = UuidSchema.parse(id);
    // Chỉ thành viên (hoặc ADMIN) mới đọc được — chống đoán id xem hội thoại lạ.
    return requireConversationMember(conversationId);
  });
}

export async function listMessagesAction(
  conversationId: string,
  cursor?: string,
  limit?: number,
) {
  return toResult<MessageListResult>(async () => {
    const parsed = ListMessagesSchema.parse({ conversationId, cursor, limit });
    // Chặn đọc lịch sử tin nhắn của hội thoại mình không thuộc.
    await requireConversationMember(parsed.conversationId);
    return chatRepository().listMessages(
      parsed.conversationId,
      parsed.cursor,
      parsed.limit,
    );
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
    const id = UuidSchema.parse(conversationId);
    await chatRepository().markRead(id);
    revalidatePath(`/conversations/${id}`);
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
    const id = UuidSchema.parse(messageId);
    await chatRepository().deleteMessage(id);
  });
}
