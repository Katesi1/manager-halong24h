export interface Conversation {
  id: string;
  property_name: string;
  property_short: string;
  customer_name: string;
  last_message_preview: string;
  last_message_from_me: boolean;
  last_message_at: string;
  unread_owner: number;
  online?: boolean;
}

export interface ChatMessage {
  id: string;
  from_me: boolean;
  content: string;
  sent_at: string;
}

export const DEMO_CONVERSATIONS: Conversation[] = [
  {
    id: 'demo-c-1',
    property_name: 'À La Carte Hạ Long Bay',
    property_short: 'P.203',
    customer_name: 'Lê Thị Linh',
    last_message_preview: 'Em cho mình hỏi có cho check-in sớm không ạ?',
    last_message_from_me: false,
    last_message_at: new Date(Date.now() - 2 * 60_000).toISOString(),
    unread_owner: 2,
    online: true,
  },
  {
    id: 'demo-c-2',
    property_name: 'Sun Grand Feria',
    property_short: 'P.105',
    customer_name: 'Phạm Hùng',
    last_message_preview: 'Có cũi cho bé 2 tuổi không em?',
    last_message_from_me: false,
    last_message_at: new Date(Date.now() - 12 * 60_000).toISOString(),
    unread_owner: 1,
  },
  {
    id: 'demo-c-3',
    property_name: 'À La Carte Hạ Long Bay',
    property_short: '',
    customer_name: 'Nguyễn Anh Tú',
    last_message_preview: '📷 Đã gửi 2 ảnh',
    last_message_from_me: true,
    last_message_at: new Date(Date.now() - 25 * 60_000).toISOString(),
    unread_owner: 3,
    online: true,
  },
  {
    id: 'demo-c-4',
    property_name: 'À La Carte Hạ Long Bay',
    property_short: 'P.203',
    customer_name: 'Trần Thị Hà',
    last_message_preview: 'Cảm ơn anh chị, hẹn gặp lại lần sau!',
    last_message_from_me: true,
    last_message_at: new Date(Date.now() - 60 * 60_000).toISOString(),
    unread_owner: 0,
  },
  {
    id: 'demo-c-5',
    property_name: 'Sun Grand Feria',
    property_short: 'P.105',
    customer_name: 'Đỗ Văn Minh',
    last_message_preview: 'OK em, hẹn 14h chiều nay nhé',
    last_message_from_me: false,
    last_message_at: new Date(Date.now() - 3 * 3600_000).toISOString(),
    unread_owner: 0,
  },
  {
    id: 'demo-c-6',
    property_name: 'À La Carte Hạ Long Bay',
    property_short: '',
    customer_name: 'Vũ Thị Mai',
    last_message_preview: 'Dạ phòng còn trống nhé chị',
    last_message_from_me: true,
    last_message_at: new Date(Date.now() - 26 * 3600_000).toISOString(),
    unread_owner: 0,
  },
];

export function getDemoMessages(conversationId: string): ChatMessage[] {
  const c = DEMO_CONVERSATIONS.find((x) => x.id === conversationId);
  if (!c) return [];
  const base = new Date(c.last_message_at).getTime();
  return [
    {
      id: `${conversationId}-m1`,
      from_me: false,
      content: 'Em chào anh/chị, em muốn hỏi thông tin phòng ạ.',
      sent_at: new Date(base - 30 * 60_000).toISOString(),
    },
    {
      id: `${conversationId}-m2`,
      from_me: true,
      content: 'Dạ anh/chị cần đặt ngày nào em check giúp ạ?',
      sent_at: new Date(base - 20 * 60_000).toISOString(),
    },
    {
      id: `${conversationId}-m3`,
      from_me: c.last_message_from_me,
      content: c.last_message_preview,
      sent_at: c.last_message_at,
    },
  ];
}
