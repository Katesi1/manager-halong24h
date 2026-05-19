import Link from 'next/link';
import { notFound } from 'next/navigation';

import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import { DEMO_CONVERSATIONS, getDemoMessages } from '../demo-data';
import { MessageComposer } from './message-composer';

export default async function HostMessageDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const conv = DEMO_CONVERSATIONS.find((c) => c.id === id);
  if (!conv) notFound();
  const messages = getDemoMessages(id);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      <div className="mb-3">
        <Link
          href="/host/messages"
          className="inline-flex items-center gap-1 text-sm text-ink-700 hover:text-navy-700"
        >
          ← Tất cả hội thoại
        </Link>
      </div>

      <h1 className="mb-3 font-display text-lg font-semibold text-ink-900">
        Hội thoại với {conv.customer_name}
        {conv.property_name && (
          <span className="ml-2 text-sm font-normal text-ink-500">
            · {conv.property_name}
          </span>
        )}
      </h1>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        {/* Conversation list (hidden on mobile) */}
        <aside className="hidden lg:block overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200">
          <ul className="divide-y divide-ink-200">
            {DEMO_CONVERSATIONS.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/host/messages/${c.id}`}
                  className={cn(
                    'block px-3 py-3 transition-colors',
                    c.id === id ? 'bg-navy-50' : 'hover:bg-cream-100',
                  )}
                >
                  <div className="flex items-center gap-2">
                    <GradientAvatar name={c.customer_name} size="sm" online={c.online} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink-900">
                        {c.customer_name}
                      </p>
                      <p className="truncate text-xs text-ink-500">
                        {c.last_message_preview}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Thread + composer */}
        <section className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-200 flex flex-col min-h-[60vh]">
          <header className="flex items-center gap-3 border-b border-ink-200 px-4 py-3">
            <GradientAvatar name={conv.customer_name} size="md" online={conv.online} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-ink-900">{conv.customer_name}</p>
              <p className="truncate text-xs text-ink-500">
                {conv.property_name}
                {conv.property_short ? ` · ${conv.property_short}` : ''}
              </p>
            </div>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-cream-50 px-4 py-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  'flex',
                  m.from_me ? 'justify-end' : 'justify-start',
                )}
              >
                <div
                  className={cn(
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm',
                    m.from_me
                      ? 'bg-navy-700 text-white'
                      : 'bg-white text-ink-900 ring-1 ring-ink-200',
                  )}
                >
                  <p>{m.content}</p>
                  <p
                    className={cn(
                      'mt-1 text-[10px]',
                      m.from_me ? 'text-white/70' : 'text-ink-500',
                    )}
                  >
                    {formatDateTime(m.sent_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <MessageComposer />
        </section>
      </div>
    </div>
  );
}
