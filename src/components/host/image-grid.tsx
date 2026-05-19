'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';

import {
  deletePropertyImageAction,
  setPropertyCoverImageAction,
} from '@/app/actions/properties';
import type { PropertyImage } from '@/core/entities/property';
import { cn } from '@/lib/utils';

interface ImageGridProps {
  propertyId: string;
  images: PropertyImage[];
}

export function ImageGrid({ propertyId, images }: ImageGridProps) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-200 bg-cream-100 p-8 text-center text-sm text-ink-500">
        Chưa có ảnh nào. Upload ảnh ở khung trên.
      </div>
    );
  }

  function onDelete(imageId: string) {
    if (!confirm('Xóa ảnh này?')) return;
    setBusyId(imageId);
    setError(null);
    startTransition(async () => {
      const result = await deletePropertyImageAction(propertyId, imageId);
      if (!result.ok) setError(result.error);
      setBusyId(null);
    });
  }

  function onSetCover(imageId: string) {
    setBusyId(imageId);
    setError(null);
    startTransition(async () => {
      const result = await setPropertyCoverImageAction(propertyId, imageId);
      if (!result.ok) setError(result.error);
      setBusyId(null);
    });
  }

  const sorted = [...images].sort((a, b) => {
    if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
    return a.order - b.order;
  });

  return (
    <div>
      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-100">
          {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {sorted.map((img) => {
          const isBusy = busyId === img.id && pending;
          return (
            <div
              key={img.id}
              className={cn(
                'group relative overflow-hidden rounded-xl bg-ink-100',
                isBusy && 'opacity-50',
              )}
            >
              <div className="relative aspect-square">
                <Image
                  src={img.imageUrl}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover"
                />
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
                  onClick={() => onDelete(img.id)}
                  disabled={pending}
                  className="ml-auto rounded-md bg-red-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
