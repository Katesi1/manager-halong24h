'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Plus, Image as ImageIcon } from 'lucide-react';

import { GuardBanner } from '@/components/host/guard-banner';
import { PageHeader } from '@/components/host/page-header';
import { PropertyWizard } from '@/components/host/property-wizard';
import type { HostGate } from '@/lib/host-gate';
import { useApiResource } from '@/lib/use-api-resource';
import { toast } from '@/components/ui/toast';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE_BYTES = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 20;

/**
 * Cổng tạo cơ sở fetch từ `/api/host/property-new-gate` PHÍA CLIENT → endpoint
 * hiện trong F12 Network. Route enforce guard server-side, client render.
 */
export function PropertyNewClient() {
  const { loading, error, data } = useApiResource<{ gate: HostGate | null }>(
    '/api/host/property-new-gate',
  );
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const incoming = Array.from(e.target.files);

      // 1. Validate từng ảnh (dung lượng đơn ≤ 10MB)
      const validIncoming: File[] = [];
      for (const file of incoming) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          toast.error(`Ảnh "${file.name}" vượt quá giới hạn 10MB.`);
        } else {
          validIncoming.push(file);
        }
      }

      if (validIncoming.length === 0) {
        e.target.value = '';
        return;
      }

      // 2. Validate số lượng ảnh tối đa
      if (selectedFiles.length + validIncoming.length > MAX_FILES) {
        toast.error(`Tối đa chỉ được chọn ${MAX_FILES} ảnh.`);
      }

      const combined = [...selectedFiles, ...validIncoming].slice(0, MAX_FILES);

      // 3. Validate tổng dung lượng ≤ 100MB
      const totalSize = combined.reduce((acc, f) => acc + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        toast.error("Tổng dung lượng ảnh vượt quá 100MB. Vui lòng chọn ít ảnh hơn hoặc giảm dung lượng ảnh.");
        e.target.value = '';
        return;
      }

      setSelectedFiles(combined);

      const newPreviews = combined.map((file) => URL.createObjectURL(file));
      previews.forEach((p) => URL.revokeObjectURL(p));
      setPreviews(newPreviews);

      e.target.value = '';
    }
  }

  function handleRemoveFile(index: number) {
    const nextFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(nextFiles);

    const newPreviews = nextFiles.map((file) => URL.createObjectURL(file));
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews(newPreviews);
  }

  function handleSetCover(index: number) {
    const nextFiles = [...selectedFiles];
    const targetFile = nextFiles[index];
    nextFiles.splice(index, 1);
    nextFiles.unshift(targetFile);
    setSelectedFiles(nextFiles);

    const newPreviews = nextFiles.map((file) => URL.createObjectURL(file));
    previews.forEach((p) => URL.revokeObjectURL(p));
    setPreviews(newPreviews);
  }

  function triggerFileSelect() {
    fileInputRef.current?.click();
  }

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p));
    };
  }, [previews]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 text-center text-sm text-ink-500">
        Đang tải…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-900 ring-1 ring-rose-200 max-w-2xl mx-auto">
          {error ?? 'Không tải được trang'}
        </div>
      </div>
    );
  }

  if (data.gate) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <GuardBanner {...data.gate} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      <PageHeader
        backHref="/host/properties"
        backLabel="Quay lại danh sách cơ sở"
        title="Thêm cơ sở mới"
        description="Điền 4 bước thông tin. Sau khi tạo bạn có thể thêm ảnh + chỉnh giá chi tiết."
        breadcrumbs={[
          { label: 'Cơ sở', href: '/host/properties' },
          { label: 'Thêm mới' },
        ]}
      />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      <PropertyWizard selectedFiles={selectedFiles} onClearFiles={() => setSelectedFiles([])} />

      <div className="mt-10 grid gap-3 md:grid-cols-3">
        <button
          type="button"
          onClick={() => setIsDialogOpen(true)}
          className={cn(
            "text-left rounded-2xl bg-white p-5 ring-1 transition-all cursor-pointer block w-full",
            selectedFiles.length === 0
              ? "ring-red-300 bg-red-50/10 hover:ring-red-400 hover:bg-red-50/20"
              : "ring-ink-200/60 shadow-card hover:ring-navy-300"
          )}
        >
          <p className="text-2xl">📷</p>
          <h3 className="mt-2 font-semibold text-ink-900 flex items-center gap-1">
            Quản lý ảnh
            {selectedFiles.length === 0 && (
              <span className="text-red-500 font-bold">*</span>
            )}
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} ảnh · Click để quản lý`
              : 'Yêu cầu tải lên ít nhất 1 ảnh'}
          </p>
        </button>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card opacity-60 pointer-events-none select-none">
          <p className="text-2xl">📅</p>
          <h3 className="mt-2 font-semibold text-ink-900">Lịch grid</h3>
          <p className="mt-1 text-xs text-ink-500">Xem trống/bận sau khi tạo</p>
        </div>
        <div className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card opacity-60 pointer-events-none select-none">
          <p className="text-2xl">📋</p>
          <h3 className="mt-2 font-semibold text-ink-900">Đặt phòng</h3>
          <p className="mt-1 text-xs text-ink-500">
            0 lượt · Quản lý sau khi tạo
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent open={isDialogOpen} className="max-w-3xl">
          <DialogTitle>Quản lý hình ảnh cơ sở</DialogTitle>
          <DialogDescription>
            Tải lên và sắp xếp hình ảnh của bạn trước khi tạo cơ sở. Ảnh đầu tiên (ở vị trí có nhãn Bìa) sẽ làm ảnh bìa cho cơ sở.
          </DialogDescription>

          <div className="mt-6 space-y-6">
            {selectedFiles.length === 0 ? (
              <div
                onClick={triggerFileSelect}
                className="flex flex-col items-center justify-center border-2 border-dashed border-ink-300 rounded-2xl p-10 bg-cream-50 hover:bg-cream-100/50 transition-colors cursor-pointer"
              >
                <ImageIcon className="h-10 w-10 text-ink-400 mb-3" />
                <p className="text-sm font-medium text-ink-900">Click để chọn tệp tin</p>
                <p className="text-xs text-ink-500 mt-1">
                  Chấp nhận JPG, PNG, WebP · Tối đa 20 ảnh, tối đa 10MB/ảnh
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-ink-600">Đã chọn {selectedFiles.length}/20 ảnh</span>
                  {selectedFiles.length < 20 && (
                    <button
                      type="button"
                      onClick={triggerFileSelect}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-navy-700"
                    >
                      <Plus className="h-3.5 w-3.5" /> Thêm ảnh
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {previews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-xl bg-ink-50 ring-1 ring-ink-200/60 group"
                    >
                      <Image
                        src={src}
                        alt=""
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 z-20">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="rounded-full bg-red-600 p-1.5 text-white hover:bg-red-700 transition-colors"
                            title="Xóa"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {idx === 0 ? (
                          <span className="self-start rounded bg-gold-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                            Ảnh bìa
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetCover(idx)}
                            className="self-start rounded bg-navy-600 px-2 py-1 text-[9px] font-bold text-white hover:bg-navy-700 transition-colors"
                          >
                            Đặt bìa
                          </button>
                        )}
                      </div>

                      {/* Always visible badge for cover */}
                      {idx === 0 && (
                        <span className="absolute left-2 top-2 rounded bg-gold-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider z-10 group-hover:opacity-0 transition-opacity">
                          Bìa
                        </span>
                      )}
                    </div>
                  ))}

                  {selectedFiles.length < 20 && (
                    <button
                      type="button"
                      onClick={triggerFileSelect}
                      className="flex flex-col items-center justify-center border-2 border-dashed border-ink-300 rounded-xl aspect-square bg-cream-50 hover:bg-cream-100/50 transition-colors cursor-pointer"
                    >
                      <Plus className="h-6 w-6 text-ink-600" />
                      <span className="text-xs text-ink-500 mt-1">Thêm ảnh</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-ink-100">
              <button
                type="button"
                onClick={() => setIsDialogOpen(false)}
                className="rounded-lg bg-navy-600 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700 transition-colors"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="mt-8 text-sm text-ink-500">
        <Link href="/host/properties" className="hover:underline">
          ← Hủy, quay lại danh sách
        </Link>
      </div>
    </div>
  );
}
