'use client';

import { useRef, useState } from 'react';

import { uploadPropertyImagesAction } from '@/app/actions/properties';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  /** Property ID — chỉ hỗ trợ property images. Room image không có endpoint BE. */
  parentId: string;
  /** Tối đa số ảnh upload cùng lúc */
  maxFiles?: number;
  /**
   * Legacy props giữ chữ ký để các page cũ truyền vào không vỡ. Bị bỏ qua.
   * @deprecated
   */
  kind?: 'property';
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
  parentId,
  maxFiles = 20,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const incoming = Array.from(files);
    if (incoming.length > maxFiles) {
      toast.warning(
        `Đã giới hạn tối đa ${maxFiles} ảnh. Bỏ qua ${incoming.length - maxFiles} ảnh thừa.`,
      );
    }
    const arr = incoming.slice(0, maxFiles);
    if (arr.length === 0) return;

    for (const f of arr) {
      if (!ACCEPTED_TYPES.includes(f.type)) {
        setError(`File "${f.name}" không hỗ trợ — chỉ JPG/PNG/WEBP`);
        return;
      }
      if (f.size > MAX_SIZE_BYTES) {
        setError(`File "${f.name}" lớn hơn 10MB`);
        return;
      }
    }

    setUploading(arr.map((f) => ({ name: f.name, pct: 30 })));

    try {
      const fd = new FormData();
      for (const f of arr) fd.append('images', f);
      const result = await uploadPropertyImagesAction(parentId, fd);
      if (!result.ok) throw new Error(result.error);
      setUploading((prev) => prev.map((u) => ({ ...u, pct: 100 })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload thất bại');
      setUploading([]);
      return;
    }

    setTimeout(() => setUploading([]), 800);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <label
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white px-6 py-12 transition-all',
          dragActive
            ? 'border-navy-700 bg-navy-50'
            : 'border-ink-200 hover:border-ink-400 hover:bg-cream-100',
        )}
      >
        <span className="text-3xl">📷</span>
        <span className="text-sm font-semibold text-ink-900">
          Kéo thả ảnh hoặc click để chọn
        </span>
        <span className="text-xs text-ink-500">
          JPG, PNG, WebP · tối đa 10MB · tối đa {maxFiles} ảnh
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}

      {uploading.length > 0 && (
        <ul className="mt-3 space-y-2">
          {uploading.map((u, i) => (
            <li key={i} className="rounded-lg bg-white p-3 ring-1 ring-ink-200/60 shadow-card">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate text-ink-700">{u.name}</span>
                <span className="font-medium text-ink-900">{u.pct}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-100">
                <div
                  className="h-full bg-navy-700 transition-all"
                  style={{ width: `${u.pct}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
