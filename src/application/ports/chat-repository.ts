import type {
  Conversation,
  ConversationFilters,
  CreateConversationInput,
  Message,
  MessageListResult,
  SendMessageInput,
} from '@/core/entities/chat';

export interface ChatRepository {
  /** GET /conversations */
  listConversations(filters?: ConversationFilters): Promise<Conversation[]>;
  /** GET /conversations/unread-count */
  unreadCount(): Promise<number>;
  /** POST /conversations (idempotent với booking-type) */
  createConversation(input: CreateConversationInput): Promise<Conversation>;
  /** GET /conversations/:id */
  getConversation(id: string): Promise<Conversation | null>;
  /** GET /conversations/:id/messages?cursor&limit */
  listMessages(
    conversationId: string,
    cursor?: string,
    limit?: number,
  ): Promise<MessageListResult>;
  /** POST /conversations/:id/messages — REST fallback */
  sendMessage(input: SendMessageInput): Promise<Message>;
  /** PATCH /conversations/:id/read */
  markRead(conversationId: string): Promise<void>;
  /** PATCH /conversations/messages/:messageId (sender, 15p) */
  editMessage(messageId: string, content: string): Promise<Message>;
  /** DELETE /conversations/messages/:messageId */
  deleteMessage(messageId: string): Promise<void>;
}
