-- Halong24h MVP — Messaging, Notifications, Favorites
-- Module 12 (Chat) + Module 13 (Notifications) + Module 14 (Favorites)

-- ===========================================================================
-- conversations: 1 cuộc trò chuyện = 1 cặp (customer × property + owner)
-- ===========================================================================

create table conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  customer_id uuid not null references profiles(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  last_message_at timestamptz not null default now(),
  last_message_preview text,
  unread_customer integer not null default 0,
  unread_owner integer not null default 0,
  created_at timestamptz not null default now(),
  unique (property_id, customer_id)
);

create index conversations_owner_idx on conversations(owner_id, last_message_at desc);
create index conversations_customer_idx on conversations(customer_id, last_message_at desc);

alter table conversations enable row level security;

create policy "conversations: customer read own"
  on conversations for select
  using (customer_id = auth.uid());
create policy "conversations: owner read own"
  on conversations for select
  using (owner_id = auth.uid());
create policy "conversations: admin read all"
  on conversations for select
  using (is_admin());
create policy "conversations: customer create"
  on conversations for insert
  with check (customer_id = auth.uid());

-- ===========================================================================
-- messages
-- ===========================================================================

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  attachment_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on messages(conversation_id, created_at);
create index messages_sender_idx on messages(sender_id);

alter table messages enable row level security;

create policy "messages: read in own conversation"
  on messages for select
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid() or c.owner_id = auth.uid() or is_admin())
    )
  );

create policy "messages: send to own conversation"
  on messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

create policy "messages: mark read in own conversation"
  on messages for update
  using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.customer_id = auth.uid() or c.owner_id = auth.uid())
    )
  );

-- ===========================================================================
-- notifications: in-app notifications
-- ===========================================================================

create type notification_type as enum (
  'booking_new',
  'booking_paid',
  'booking_check_in',
  'booking_check_out',
  'booking_cancelled',
  'lead_new',
  'message_new',
  'review_new',
  'review_reply',
  'host_approved',
  'host_rejected',
  'system'
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on notifications(user_id, created_at desc);
create index notifications_unread_idx on notifications(user_id) where read_at is null;

alter table notifications enable row level security;

create policy "notifications: read own"
  on notifications for select
  using (user_id = auth.uid());

create policy "notifications: mark own read"
  on notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ===========================================================================
-- favorites
-- ===========================================================================

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create index favorites_user_idx on favorites(user_id, created_at desc);

alter table favorites enable row level security;

create policy "favorites: read own"
  on favorites for select
  using (user_id = auth.uid());

create policy "favorites: insert own"
  on favorites for insert
  with check (user_id = auth.uid());

create policy "favorites: delete own"
  on favorites for delete
  using (user_id = auth.uid());

-- ===========================================================================
-- Helper: update conversation last_message_at + preview when message inserted
-- ===========================================================================

create or replace function update_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update conversations
  set
    last_message_at = new.created_at,
    last_message_preview = substring(new.content from 1 for 200),
    unread_customer = case
      when (select customer_id from conversations where id = new.conversation_id) <> new.sender_id
      then unread_customer + 1
      else unread_customer
    end,
    unread_owner = case
      when (select owner_id from conversations where id = new.conversation_id) <> new.sender_id
      then unread_owner + 1
      else unread_owner
    end
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_after_insert
  after insert on messages
  for each row execute function update_conversation_on_message();
