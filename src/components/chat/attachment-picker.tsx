'use client';

import { useRef, useState } from 'react';
import { FileText, Paperclip, X } from 'lucide-react';
import Image from 'next/image';

import {
  deleteUploadAction,
  uploadFileAction,
} from '@/app/actions/uploads';
import {
  CHAT_ATTACHMENT_MAX_COUNT,
  isAllowedMime,
  isImageMime,
  UPLOAD_ALLOWED_MIME,
  UPLOAD_MAX_SIZE_BYTES,
  type UploadResult,
} from '@/core/entities/upload';
import { cn } from '@/lib/utils';

export interface PendingAttachment {
  upload: UploadResult;
  /** Preview URL local (ObjectURL) cho image — revoke khi unmount. */
  previewUrl?: string;
}

interface Props {
  attachments: PendingAttachment[];
  onAdd: (a: PendingAttachment) => void;
  onRemove: (uploadId: string) => void;
  disabled?: boolean;
}

const ACCEPT_ATTR = UPLOAD_ALLOWED_MIME.join(',');

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export function AttachmentPicker({
  attachments,
  onAdd,
  onRemove,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = attachments.length >= CHAT_ATTACHMENT_MAX_COUNT;

  async function handleFile(file: File) {
    if (atLimit) {
      setError(`Tối đa ${CHAT_ATTACHMENT_MAX_COUNT} file/tin nhắn`);
      return;
    }
    if (file.size > UPLOAD_MAX_SIZE_BYTES) {
      setError(
        `${file.name} quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa 10MB.`,
      );
      return;
    }
    if (file.type && !isAllowedMime(file.type)) {
      setError(`Định dạng ${file.type} không được hỗ trợ`);
      return;
    }

    setError(null);
    setUploading(true);

    // Object URL để preview ngay (trước khi BE trả). Revoke khi remove.
    const previewUrl = isImageMime(file.type)
      ? URL.createObjectURL(file)
      : undefined;

    const fd = new FormData();
    fd.append('file', file);
    const res = await uploadFileAction(fd);
    setUploading(false);

    if (res.ok) {
      onAdd({ upload: res.data, previewUrl });
    } else {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setError(res.error);
    }
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    // Upload tuần tự để tránh spike rate-limit + UX rõ ràng.
    for (let i = 0; i < files.length; i += 1) {
      const file = files.item(i);
      if (!file) continue;
      await handleFile(file);
    }
    // Reset để cho user re-upload cùng file nếu muốn
    e.target.value = '';
  }

  async function handleRemove(a: PendingAttachment) {
    if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
    onRemove(a.upload.id);
    // Best-effort xoá orphan ở BE. Nếu fail (đã attach hay race), BE cron sẽ
    // tự dọn sau 24h — không cần show error cho user.
    void deleteUploadAction(a.upload.id);
  }

  return (
    <div className="space-y-2">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-2">
          {attachments.map((a) => {
            const isImg = isImageMime(a.upload.type);
            return (
              <div
                key={a.upload.id}
                className="relative flex items-center gap-2 rounded-lg bg-cream-100 px-2 py-1.5 text-xs ring-1 ring-ink-200"
              >
                {isImg && a.previewUrl ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded">
                    <Image
                      src={a.previewUrl}
                      alt={a.upload.name}
                      fill
                      className="object-cover"
                      sizes="32px"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded bg-white ring-1 ring-ink-200">
                    <FileText className="h-4 w-4 text-ink-500" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="max-w-[120px] truncate font-medium text-ink-900">
                    {a.upload.name}
                  </p>
                  <p className="text-[10px] text-ink-500">
                    {formatSize(a.upload.size)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemove(a)}
                  disabled={disabled}
                  aria-label={`Bỏ ${a.upload.name}`}
                  className="ml-1 grid h-5 w-5 place-items-center rounded-full hover:bg-rose-100 disabled:opacity-50"
                >
                  <X className="h-3 w-3 text-ink-600" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {error && (
        <p className="px-3 text-[11px] text-rose-600">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        multiple
        onChange={handleChange}
        className="hidden"
        aria-label="Chọn file đính kèm"
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || atLimit}
        aria-label="Đính kèm file"
        title={
          atLimit
            ? `Đã đạt giới hạn ${CHAT_ATTACHMENT_MAX_COUNT} file`
            : 'Đính kèm ảnh hoặc PDF'
        }
        className={cn(
          'grid h-10 w-10 place-items-center rounded-xl border border-ink-200 bg-white text-ink-700',
          'hover:bg-cream-100 disabled:opacity-50 disabled:cursor-not-allowed',
        )}
      >
        {uploading ? (
          <span className="text-xs">...</span>
        ) : (
          <Paperclip className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
