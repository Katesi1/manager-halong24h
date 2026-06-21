'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface Props {
  value: string;
  /** Giới hạn bề rộng hiển thị (px). Nội dung dài bị cắt + tooltip full. */
  maxWidthClass?: string;
}

/**
 * Chip hiển thị một chuỗi (vd nội dung CK) trên 1 dòng, cắt gọn cho đỡ rối,
 * click để copy nguyên văn vào clipboard. Hover xem full qua tooltip.
 */
export function CopyableCode({ value, maxWidthClass = 'max-w-[220px]' }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        /* clipboard bị chặn (http/permission) — bỏ qua, không phá UI */
      });
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`${value}\n(bấm để copy)`}
      className={`inline-flex ${maxWidthClass} items-center gap-1.5 rounded-md bg-cream-100 px-2 py-1 font-mono text-[11px] text-ink-700 ring-1 ring-ink-200/60 transition-colors hover:bg-cream-200`}
    >
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3 shrink-0 text-ink-400" />
      )}
      <span className="truncate">{value}</span>
    </button>
  );
}
