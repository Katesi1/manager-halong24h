/**
 * Chat — spec §17.
 *
 * REST cho list/detail/send/mark-read/edit/delete.
 * WebSocket (`/chat` namespace) cho realtime — sẽ wire client riêng.
 */

export type ConversationType = 'booking' | 'support' | 'staff';

export type ConversationMemberRole = 'owner' | 'sale' | 'customer' | 'admin';

export interface MessageAttachment {
  url: string;
  type: string;
  name: string;
  size: number;
}

export interface ConversationMember {
  userId: string;
  role: ConversationMemberRole;
  lastReadAt: string | null;
  unreadCount: number;
  user: { id: string; name: string; avatar: string | null };
}

export interface Conversation {
  id: string;
  type: ConversationType;
  bookingId: string | null;
  propertyId: string | null;
  subject: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSenderId: string | null;
  hasDispute: boolean;
  archivedAt: string | null;
  createdAt: string;
  members: ConversationMember[];
  myUnread: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  attachments: MessageAttachment[];
  isSystem: boolean;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
}

export interface ConversationFilters {
  role?: ConversationMemberRole;
  page?: number;
  limit?: number;
}

export interface CreateConversationInput {
  type: ConversationType;
  bookingId?: string;
  subject?: string;
}

export interface SendMessageInput {
  conversationId: string;
  content: string;
  attachments?: MessageAttachment[];
}

export interface MessageListResult {
  items: Message[];
  nextCursor: string | null;
}
