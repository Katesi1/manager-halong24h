import 'server-only';

import type {
  Conversation,
  ConversationFilters,
  CreateConversationInput,
  Message,
  MessageListResult,
  SendMessageInput,
} from '@/core/entities/chat';
import type { ChatRepository } from '@/application/ports/chat-repository';

import { apiClient } from '../http/api-client';

export class ApiChatRepository implements ChatRepository {
  async listConversations(
    filters?: ConversationFilters,
  ): Promise<Conversation[]> {
    const data = await apiClient.get<Conversation[] | { items: Conversation[] }>(
      '/conversations',
      {
        query: {
          role: filters?.role,
          page: filters?.page,
          limit: filters?.limit,
        },
        cache: 'no-store',
      },
    );
    return Array.isArray(data) ? data : (data.items ?? []);
  }

  async unreadCount(): Promise<number> {
    const data = await apiClient.get<number | { count: number }>(
      '/conversations/unread-count',
      { cache: 'no-store' },
    );
    return typeof data === 'number' ? data : data.count;
  }

  async createConversation(
    input: CreateConversationInput,
  ): Promise<Conversation> {
    return apiClient.post<Conversation>('/conversations', input);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    try {
      return await apiClient.get<Conversation>(`/conversations/${id}`, {
        cache: 'no-store',
      });
    } catch (err) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async listMessages(
    conversationId: string,
    cursor?: string,
    limit = 50,
  ): Promise<MessageListResult> {
    return apiClient.get<MessageListResult>(
      `/conversations/${conversationId}/messages`,
      {
        query: { cursor, limit },
        cache: 'no-store',
      },
    );
  }

  async sendMessage(input: SendMessageInput): Promise<Message> {
    return apiClient.post<Message>(
      `/conversations/${input.conversationId}/messages`,
      { content: input.content, attachments: input.attachments },
    );
  }

  async markRead(conversationId: string): Promise<void> {
    await apiClient.patch(`/conversations/${conversationId}/read`);
  }

  async editMessage(messageId: string, content: string): Promise<Message> {
    return apiClient.patch<Message>(
      `/conversations/messages/${messageId}`,
      { content },
    );
  }

  async deleteMessage(messageId: string): Promise<void> {
    await apiClient.delete(`/conversations/messages/${messageId}`);
  }
}
