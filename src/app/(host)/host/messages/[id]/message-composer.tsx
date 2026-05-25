'use client';

import { useState, type FormEvent } from 'react';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface OptimisticMessage {
  id: string;
  content: string;
  sent_at: string;
}

export function MessageComposer() {
  const [text, setText] = useState('');
  const [sent, setSent] = useState<OptimisticMessage[]>([]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
    setSent((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, content, sent_at: new Date().toISOString() },
    ]);
    setText('');
    toast.success('Đã gửi');
  }

  return (
    <div className="border-t border-ink-200 bg-white">
      {sent.length > 0 && (
        <ul className="space-y-2 px-4 pt-3">
          {sent.map((m) => (
            <li key={m.id} className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl bg-navy-700 px-3 py-2 text-sm text-white">
                <p>{m.content}</p>
                <p className="mt-1 text-[10px] text-white/70">Vừa gửi</p>
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Nhập tin nhắn..."
          className={cn(
            'flex-1 resize-none rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-navy-700/30',
          )}
          aria-label="Nội dung tin nhắn"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="h-10 rounded-xl bg-navy-900 px-4 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
        >
          Gửi
        </button>
      </form>
    </div>
  );
}
