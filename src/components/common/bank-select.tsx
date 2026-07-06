'use client';

import { useMemo, useState } from 'react';

import { Label } from '@/components/ui/input';
import { VN_BANKS } from '@/lib/vn-banks';

interface BankSelectProps {
  /** Giá trị BIN prefill (khi sửa STK đã có). */
  defaultBin?: string | null;
  /** Tên ngân hàng prefill — dùng khi BIN cũ không nằm trong danh sách. */
  defaultName?: string | null;
  /** Lỗi field bankBin từ server action. */
  error?: string;
  id?: string;
  label?: string;
  required?: boolean;
}

/**
 * Dropdown chọn ngân hàng → tự điền mã BIN (`name="bankBin"`) + tên
 * (`name="bankName"` hidden) vào FormData. Thay ô gõ tay BIN để tránh gõ sai
 * làm VietQR trỏ nhầm ngân hàng. Danh sách BIN ở [vn-banks.ts](src/lib/vn-banks.ts).
 */
export function BankSelect({
  defaultBin,
  defaultName,
  error,
  id = 'bankBin',
  label = 'Ngân hàng',
  required,
}: BankSelectProps) {
  // Nếu BIN cũ không có trong danh sách (dữ liệu legacy) → giữ lại 1 option để
  // không mất giá trị đang lưu.
  const options = useMemo(() => {
    if (defaultBin && !VN_BANKS.some((b) => b.bin === defaultBin)) {
      return [
        { bin: defaultBin, name: defaultName || `Ngân hàng (${defaultBin})` },
        ...VN_BANKS,
      ];
    }
    return VN_BANKS;
  }, [defaultBin, defaultName]);

  const [bin, setBin] = useState(defaultBin ?? '');
  const selectedName =
    options.find((b) => b.bin === bin)?.name ?? defaultName ?? '';

  return (
    <div>
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
      <select
        id={id}
        name="bankBin"
        value={bin}
        onChange={(e) => setBin(e.target.value)}
        required={required}
        className="h-11 w-full rounded-[10px] border border-ink-300 bg-white px-4 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-ink-100"
      >
        <option value="" disabled>
          — Chọn ngân hàng —
        </option>
        {options.map((b) => (
          <option key={b.bin} value={b.bin}>
            {b.name} — {b.bin}
          </option>
        ))}
      </select>
      {/* Tên ngân hàng đi kèm để lưu + hiển thị (auto theo lựa chọn). */}
      <input type="hidden" name="bankName" value={selectedName} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      <p className="mt-1 text-[11px] text-ink-400">
        Chọn ngân hàng — mã BIN &amp; tên tự điền để sinh VietQR.
      </p>
    </div>
  );
}
