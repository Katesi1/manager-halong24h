'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useState } from 'react';

import { toast } from '@/components/ui/toast';

const EXPORT_OPTIONS = [
  { key: 'xlsx', label: '📊 Excel (.xlsx)' },
  { key: 'csv', label: '📄 CSV (.csv)' },
  { key: 'pdf', label: '📕 PDF (.pdf)' },
] as const;

export function PaymentsExport() {
  const [open, setOpen] = useState(false);

  function handleExport(_format: (typeof EXPORT_OPTIONS)[number]['key']) {
    toast.success(
      'Đang chuẩn bị file. Sẽ gửi qua email trong vài phút.',
    );
    setOpen(false);
  }

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-300 bg-white px-3.5 text-sm font-semibold text-ink-900 hover:border-ink-900 hover:bg-cream-100"
        >
          📥 Xuất báo cáo
          <span aria-hidden className="text-[10px]">
            ▾
          </span>
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[180px] rounded-xl bg-white p-1 shadow-xl ring-1 ring-ink-200"
        >
          {EXPORT_OPTIONS.map((opt) => (
            <DropdownMenu.Item
              key={opt.key}
              onSelect={() => handleExport(opt.key)}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-ink-900 outline-none hover:bg-cream-100 focus:bg-cream-100"
            >
              {opt.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
