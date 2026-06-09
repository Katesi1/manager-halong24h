'use client';

import { cn } from '@/lib/utils';

interface Props {
  connected: boolean;
  peerOnline: boolean;
  someoneTyping: boolean;
  error: string | null;
}

export function ChatStatusBar({
  connected,
  peerOnline,
  someoneTyping,
  error,
}: Props) {
  return (
    <div className="flex items-center justify-between px-4 py-1 text-[10px] text-ink-400">
      <span
        className={cn(
          'inline-flex items-center gap-1',
          connected ? 'text-emerald-600' : 'text-ink-400',
        )}
      >
        <span
          className={cn(
            'inline-block h-1.5 w-1.5 rounded-full',
            connected ? 'bg-emerald-500' : 'bg-ink-300',
          )}
        />
        {connected ? 'Trực tuyến' : 'Đang kết nối...'}
      </span>
      {peerOnline && (
        <span className="text-emerald-600">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
          Đang online
        </span>
      )}
      {someoneTyping && (
        <span className="italic text-ink-500">Đang nhập tin nhắn...</span>
      )}
      {error && <span className="text-rose-600">{error}</span>}
    </div>
  );
}
