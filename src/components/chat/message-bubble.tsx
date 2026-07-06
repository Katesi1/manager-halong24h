'use client';

import { useState, type KeyboardEvent } from 'react';
import { FileText, Download } from 'lucide-react';
import Image from 'next/image';

import {
  deleteMessageAction,
  editMessageAction,
} from '@/app/actions/conversations';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import type { Message, MessageAttachment } from '@/core/entities/chat';
import { isImageMime } from '@/core/entities/upload';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(1)}MB`;
}

function AttachmentList({
  attachments,
  fromMe,
}: {
  attachments: MessageAttachment[];
  fromMe: boolean;
}) {
  return (
    <div className="mt-2 space-y-1.5">
      {attachments.map((a, i) => {
        // Tin đến qua WS không đi qua Zod của sendMessageAction → re-validate
        // scheme lúc render, chặn javascript:/data: lọt vào href/src (stored XSS).
        if (!/^https:\/\//i.test(a.url)) {
          return (
            <p
              key={`${a.url}-${i}`}
              className="text-xs italic text-ink-400"
              title={a.url}
            >
              (Tệp đính kèm không hợp lệ)
            </p>
          );
        }
        const isImg = isImageMime(a.type);
        if (isImg) {
          return (
            <a
              key={`${a.url}-${i}`}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-[240px] overflow-hidden rounded-lg ring-1 ring-black/10 hover:opacity-90"
            >
              <Image
                src={a.url}
                alt={a.name}
                width={240}
                height={180}
                className="h-auto w-full object-cover"
                sizes="240px"
                unoptimized
              />
            </a>
          );
        }
        return (
          <a
            key={`${a.url}-${i}`}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            download={a.name}
            className={cn(
              'flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ring-1',
              fromMe
                ? 'bg-white/10 ring-white/20 hover:bg-white/15'
                : 'bg-cream-100 ring-ink-200 hover:bg-cream-200',
            )}
          >
            <FileText
              className={cn(
                'h-4 w-4 shrink-0',
                fromMe ? 'text-white/80' : 'text-ink-500',
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{a.name}</p>
              <p
                className={cn(
                  'text-[10px]',
                  fromMe ? 'text-white/60' : 'text-ink-500',
                )}
              >
                {formatBytes(a.size)}
              </p>
            </div>
            <Download
              className={cn(
                'h-3 w-3 shrink-0',
                fromMe ? 'text-white/60' : 'text-ink-400',
              )}
            />
          </a>
        );
      })}
    </div>
  );
}

/** Spec §17.1 — sender chỉ edit/delete trong 15 phút sau gửi. */
const EDIT_WINDOW_MS = 15 * 60 * 1000;

interface Props {
  message: Message;
  fromMe: boolean;
  onEdited: (updated: Pick<Message, 'id' | 'content' | 'editedAt'>) => void;
  onDeleted: (messageId: string) => void;
}

export function MessageBubble({ message, fromMe, onEdited, onDeleted }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isDeleted = message.deletedAt !== null;
  const isOptimistic = message.id.startsWith('local-');
  const age = Date.now() - new Date(message.createdAt).getTime();
  const withinWindow = age < EDIT_WINDOW_MS;
  const canEdit = fromMe && !isDeleted && !isOptimistic && withinWindow;
  const canDelete = fromMe && !isDeleted && !isOptimistic;

  function startEdit() {
    setEditText(message.content);
    setError(null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
    setEditText(message.content);
    setError(null);
  }

  async function submitEdit() {
    const content = editText.trim();
    if (!content || content === message.content) {
      cancelEdit();
      return;
    }
    setBusy(true);
    setError(null);
    const res = await editMessageAction({
      messageId: message.id,
      content,
    });
    setBusy(false);
    if (res.ok) {
      onEdited({
        id: message.id,
        content: res.data.content,
        editedAt: res.data.editedAt,
      });
      setIsEditing(false);
    } else {
      setError(res.error);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError(null);
    const res = await deleteMessageAction(message.id);
    setBusy(false);
    setConfirmingDelete(false);
    if (res.ok) {
      onDeleted(message.id);
    } else {
      setError(res.error);
    }
  }

  function handleEditKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape') cancelEdit();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void submitEdit();
    }
  }

  return (
    <div className={cn('flex group', fromMe ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'relative max-w-[75%] rounded-2xl px-3 py-2 text-sm',
          fromMe
            ? 'bg-navy-700 text-white'
            : 'bg-white text-ink-900 ring-1 ring-ink-200',
          isDeleted && 'italic opacity-60',
        )}
      >
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleEditKey}
              rows={2}
              disabled={busy}
              autoFocus
              className="w-full min-w-[200px] resize-none rounded-lg bg-white/10 px-2 py-1 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-1 focus:ring-white/40 disabled:opacity-50"
              aria-label="Sửa tin nhắn"
            />
            <div className="flex items-center justify-end gap-2 text-[11px]">
              <button
                type="button"
                onClick={cancelEdit}
                disabled={busy}
                className="text-white/70 hover:text-white"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={() => void submitEdit()}
                disabled={busy || !editText.trim()}
                className="rounded-md bg-white/20 px-2 py-0.5 font-semibold text-white hover:bg-white/30 disabled:opacity-50"
              >
                {busy ? '...' : 'Lưu'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.content.trim() && (
              <p className="whitespace-pre-wrap">
                {isDeleted ? '(Tin nhắn đã xoá)' : message.content}
              </p>
            )}
            {!isDeleted && message.attachments.length > 0 && (
              <AttachmentList
                attachments={message.attachments}
                fromMe={fromMe}
              />
            )}
            {isDeleted && !message.content.trim() && (
              <p className="whitespace-pre-wrap">(Tin nhắn đã xoá)</p>
            )}
            <p
              className={cn(
                'mt-1 text-[10px]',
                fromMe ? 'text-white/70' : 'text-ink-500',
              )}
            >
              {formatDateTime(message.createdAt)}
              {message.editedAt && !isDeleted && (
                <span className="ml-1">· đã chỉnh sửa</span>
              )}
            </p>
            {(canEdit || canDelete) && (
              <div
                className={cn(
                  'absolute -top-3 right-2 flex items-center gap-1',
                  'opacity-0 group-hover:opacity-100 transition-opacity',
                )}
              >
                {canEdit && (
                  <button
                    type="button"
                    onClick={startEdit}
                    disabled={busy}
                    className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-ink-700 shadow ring-1 ring-ink-200 hover:bg-cream-100 disabled:opacity-50"
                    aria-label="Sửa tin nhắn"
                  >
                    Sửa
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    disabled={busy}
                    className="rounded-md bg-white px-2 py-0.5 text-[10px] font-medium text-rose-700 shadow ring-1 ring-rose-200 hover:bg-rose-50 disabled:opacity-50"
                    aria-label="Xoá tin nhắn"
                  >
                    Xoá
                  </button>
                )}
              </div>
            )}
          </>
        )}
        {error && (
          <p className="mt-1 text-[10px] text-rose-200">{error}</p>
        )}
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        title="Xoá tin nhắn này?"
        description="Tin nhắn sẽ bị xoá khỏi hội thoại. Người nhận sẽ thấy '(Tin nhắn đã xoá)'."
        confirmLabel="Xoá"
        variant="danger"
        pending={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setConfirmingDelete(false)}
      />
    </div>
  );
}
