'use client';

interface Props {
  peerOnline: boolean;
  someoneTyping: boolean;
  error: string | null;
}

/**
 * Thanh tín hiệu trên composer — chỉ render khi có gì đáng nói (peer online /
 * đang nhập / lỗi). Trạng thái kết nối socket không hiển thị (nhiễu, user
 * không cần biết; reconnect do Provider tự lo).
 */
export function ChatStatusBar({ peerOnline, someoneTyping, error }: Props) {
  if (!peerOnline && !someoneTyping && !error) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-1 text-[10px] text-ink-400">
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
