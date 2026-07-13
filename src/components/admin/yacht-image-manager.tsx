'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';

import {
  deleteYachtImageAction,
  setYachtCoverImageAction,
  uploadYachtImagesAction,
} from '@/app/actions/yachts';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import { refetchApiResources } from '@/lib/use-api-resource';
import type { YachtImage } from '@/core/entities/yacht';
import { cn } from '@/lib/utils';

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILES = 20;

interface Props {
  yachtId: string;
  images: YachtImage[];
}

export function YachtImageManager({ yachtId, images }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function handleFiles(files: FileList | File[]) {
    setError(null);
    const arr = Array.from(files).slice(0, MAX_FILES);
    if (arr.length === 0) return;
    for (const f of arr) {
      if (!ACCEPTED.includes(f.type)) {
        setError(`File "${f.name}" không hỗ trợ — chỉ JPG/PNG/WEBP`);
        return;
      }
      if (f.size > MAX_SIZE) {
        setError(`File "${f.name}" lớn hơn 10MB`);
        return;
      }
    }
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of arr) fd.append('images', f);
      const res = await uploadYachtImagesAction(yachtId, fd);
      if (!res.ok) throw new Error(res.error);
      toast.success(`Đã tải lên ${arr.length} ảnh`);
      refetchApiResources();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải ảnh thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onSetCover(imageId: string) {
    setBusyId(imageId);
    startTransition(async () => {
      const res = await setYachtCoverImageAction(yachtId, imageId);
      if (!res.ok) setError(res.error);
      else refetchApiResources();
      setBusyId(null);
    });
  }

  function confirmDelete() {
    const imageId = pendingDelete;
    if (!imageId) return;
    setPendingDelete(null);
    setBusyId(imageId);
    startTransition(async () => {
      const res = await deleteYachtImageAction(yachtId, imageId);
      if (!res.ok) setError(res.error);
      else refetchApiResources();
      setBusyId(null);
    });
  }

  const sorted = [...images].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.order - b.order;
  });

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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-white px-6 py-10 transition-all',
          dragActive ? 'border-navy-700 bg-navy-50' : 'border-ink-200 hover:border-ink-400 hover:bg-cream-100',
        )}
      >
        <span className="text-3xl">⚓</span>
        <span className="text-sm font-semibold text-ink-900">
          {uploading ? 'Đang tải lên…' : 'Kéo thả ảnh hoặc click để chọn'}
        </span>
        <span className="text-xs text-ink-500">JPG, PNG, WebP · tối đa 10MB · tối đa {MAX_FILES} ảnh/lần</span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(',')}
          multiple
          className="hidden"
          disabled={uploading}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">{error}</div>
      )}

      {sorted.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-ink-200 bg-cream-100 p-8 text-center text-sm text-ink-500">
          Chưa có ảnh nào.
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {sorted.map((img) => {
            const isBusy = busyId === img.id && pending;
            return (
              <div key={img.id} className={cn('group relative overflow-hidden rounded-xl bg-ink-100', isBusy && 'opacity-50')}>
                <div className="relative aspect-square">
                  <Image src={img.imageUrl} alt="" fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" />
                </div>
                {img.isCover && (
                  <div className="absolute left-2 top-2 rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Bìa
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex translate-y-full items-center justify-between gap-2 bg-gradient-to-t from-black/80 to-transparent p-2 transition-transform group-hover:translate-y-0">
                  {!img.isCover && (
                    <button
                      type="button"
                      onClick={() => onSetCover(img.id)}
                      disabled={pending}
                      className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-ink-900 hover:bg-cream-100"
                    >
                      Đặt bìa
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPendingDelete(img.id)}
                    disabled={pending}
                    className="ml-auto rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                  >
                    Xoá
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Xoá ảnh này?"
        description="Ảnh sẽ bị xoá vĩnh viễn khỏi du thuyền. Không thể khôi phục."
        confirmLabel="Xoá"
        variant="danger"
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
