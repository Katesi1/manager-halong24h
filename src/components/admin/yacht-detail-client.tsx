'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { deleteYachtAction, updateYachtAction } from '@/app/actions/yachts';
import { YachtForm } from '@/components/admin/yacht-form';
import { YachtImageManager } from '@/components/admin/yacht-image-manager';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { toast } from '@/components/ui/toast';
import type { Yacht } from '@/core/entities/yacht';
import { refetchApiResources, useApiResource } from '@/lib/use-api-resource';

type SectionKey = 'info' | 'images';

export function YachtDetailClient({ id }: { id: string }) {
  const { loading, error, data } = useApiResource<Yacht>(`/api/admin/yachts/${id}`);
  const [tab, setTab] = useState<SectionKey>('info');

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error || !data) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        {error ?? 'Không tìm thấy du thuyền'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatusBar yacht={data} />

      <div className="flex gap-2 border-b border-ink-200">
        {(
          [
            { key: 'info', label: 'Thông tin & giá' },
            { key: 'images', label: `Ảnh (${data.images.length})` },
          ] as { key: SectionKey; label: string }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              'border-b-2 px-3 py-2 text-sm font-semibold transition-colors ' +
              (tab === t.key
                ? 'border-navy-900 text-navy-900'
                : 'border-transparent text-ink-500 hover:text-ink-800')
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' ? (
        <YachtForm yacht={data} />
      ) : (
        <YachtImageManager yachtId={data.id} images={data.images} />
      )}
    </div>
  );
}

function StatusBar({ yacht }: { yacht: Yacht }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function toggleActive() {
    startTransition(async () => {
      const res = await updateYachtAction(yacht.id, { isActive: !yacht.isActive });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(yacht.isActive ? 'Đã ẩn du thuyền' : 'Đã mở lại du thuyền');
      refetchApiResources();
      router.refresh();
    });
  }

  function onDelete() {
    setConfirmDelete(false);
    startTransition(async () => {
      const res = await deleteYachtAction(yacht.id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success('Đã xoá du thuyền');
      router.push('/admin/yachts');
    });
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-card ring-1 ring-ink-200/60">
      <div className="flex items-center gap-3">
        <span
          className={
            'rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ' +
            (yacht.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-ink-100 text-ink-600 ring-ink-200')
          }
        >
          {yacht.isActive ? '● Đang hoạt động' : '○ Đã ẩn'}
        </span>
        <span className="text-sm text-ink-500">Mã: <span className="font-medium text-ink-800">{yacht.code}</span></span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={toggleActive} disabled={pending}>
          {yacht.isActive ? 'Ẩn du thuyền' : 'Mở lại'}
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)} disabled={pending}>
          Xoá
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá du thuyền này?"
        description="Du thuyền sẽ bị xoá (xoá mềm) khỏi hệ thống. Các đơn đã có vẫn được giữ."
        confirmLabel="Xoá du thuyền"
        variant="danger"
        pending={pending}
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
