'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import { useToast } from '@/components/ui/toast';

const PERIODS = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'year', label: 'Năm này' },
] as const;

interface CsvData {
  filename: string;
  rows: { [key: string]: string | number }[];
}

interface Props {
  csv: CsvData;
  period: string;
}

export function ReportToolbar({ csv, period }: Props) {
  const { show } = useToast();
  const router = useRouter();
  const sp = useSearchParams();

  function changePeriod(next: string) {
    const params = new URLSearchParams(sp.toString());
    params.set('period', next);
    router.push(`/host/reports?${params.toString()}`);
  }

  function exportCsv() {
    if (csv.rows.length === 0) {
      show('Không có dữ liệu để xuất', 'warning');
      return;
    }
    const headers = Object.keys(csv.rows[0]);
    const lines = [
      headers.join(','),
      ...csv.rows.map((r) =>
        headers.map((h) => csvEscape(String(r[h] ?? ''))).join(','),
      ),
    ];
    const blob = new Blob(['﻿' + lines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = csv.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    show(`✓ Đã tải ${csv.filename}`, 'success');
  }

  return (
    <div className="flex gap-2">
      <select
        value={period}
        onChange={(e) => changePeriod(e.target.value)}
        className="h-9 rounded-lg border border-ink-300 bg-white px-3 text-sm"
      >
        {PERIODS.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>
      <button
        onClick={exportCsv}
        type="button"
        className="inline-flex h-9 items-center rounded-[10px] border border-ink-300 px-3 text-sm font-medium hover:bg-cream-100"
      >
        📥 Xuất CSV
      </button>
    </div>
  );
}

function csvEscape(s: string): string {
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
