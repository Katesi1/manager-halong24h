'use client';

import { useRef, useState } from 'react';

import { uploadPropertyImagesAction } from '@/app/actions/properties';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import { refetchApiResources } from '@/lib/use-api-resource';
interface ImageUploaderProps {
  parentId: string;
  maxFiles?: number;
  existingCount?: number;
  kind?: 'property';
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function ImageUploader({
  parentId,
  maxFiles = 20,
  existingCount = 0,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const incoming = Array.from(files);

    const allowedNew = Math.max(0, maxFiles - existingCount);
    if (allowedNew === 0) {
      setError(`Giới hạn tối đa là ${maxFiles} ảnh. Vui lòng xóa bớt ảnh trước khi tải thêm.`);
      toast.error(`Giới hạn tối đa là ${maxFiles} ảnh. Vui lòng xóa bớt ảnh trước khi tải thêm.`);
      return;
    }

    if (incoming.length > allowedNew) {
      toast.warning(
        `Chỉ được tải lên tối đa ${allowedNew} ảnh nữa (giới hạn ${maxFiles} ảnh). Bỏ qua ${incoming.length - allowedNew} ảnh thừa.`,
      );
    }
    const arr = incoming.slice(0, allowedNew);
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

    const totalSize = arr.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      setError("Tổng dung lượng ảnh vượt quá 100MB. Vui lòng chọn ít ảnh hơn.");
      return;
    }

    setUploading(arr.map((f) => ({ name: f.name, pct: 30 })));

    try {
      const fd = new FormData();
      fd.append('propertyId', parentId);
      for (const f of arr) fd.append('images', f);
      const result = await uploadPropertyImagesAction(fd);
      if (!result.ok) throw new Error(result.error);
      setUploading((prev) => prev.map((u) => ({ ...u, pct: 100 })));
      refetchApiResources();
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
