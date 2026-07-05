'use client';

import { useMemo, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

import { SystemSaleRowActions } from '@/components/admin/system-sale-row-actions';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export interface SystemSaleRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

type StatusFilter = 'all' | 'active' | 'disabled';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'disabled', label: 'Tạm khóa' },
];

function parseStatus(v: string | undefined): StatusFilter {
  return v === 'active' || v === 'disabled' ? v : 'all';
}

/** Đồng bộ bộ lọc lên URL (replaceState — không re-run server). */
function syncUrl(status: StatusFilter, q: string) {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  const qs = params.toString();
  window.history.replaceState(
    null,
    '',
    qs ? `?${qs}` : window.location.pathname,
  );
}

/**
 * Bộ lọc + bảng System SALE — lọc/tìm in-memory trên list đã fetch 1 lần
 * (0 round-trip khi gõ tìm kiếm / đổi tab).
 */
export function SystemSalesBrowser({
  rows,
  initialStatus,
  initialQ,
}: {
  rows: SystemSaleRow[];
  initialStatus?: string;
  initialQ?: string;
}) {
  const [status, setStatus] = useState<StatusFilter>(() =>
    parseStatus(initialStatus),
  );
  const [q, setQ] = useState(initialQ ?? '');

  const counts = useMemo(
    () => ({
      all: rows.length,
      active: rows.filter((r) => r.isActive).length,
      disabled: rows.filter((r) => !r.isActive).length,
    }),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((r) =>
        status === 'all' ? true : status === 'active' ? r.isActive : !r.isActive,
      )
      .filter((r) => {
        if (!needle) return true;
        return (
          r.name.toLowerCase().includes(needle) ||
          r.email.toLowerCase().includes(needle) ||
          (r.phone ?? '').includes(needle)
        );
      });
  }, [rows, status, q]);

  function changeStatus(v: StatusFilter) {
    setStatus(v);
    syncUrl(v, q);
  }

  function changeQ(v: string) {
    setQ(v);
    syncUrl(status, v);
  }

  return (
    <div className="space-y-4">
      {/* ── Bộ lọc ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => changeStatus(t.value)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-colors',
                status === t.value
                  ? 'bg-navy-900 text-white ring-navy-900'
                  : 'bg-white text-ink-700 ring-ink-200 hover:bg-cream-100',
              )}
            >
              {t.label}
              <span
                className={cn(
                  'ml-1.5 text-xs',
                  status === t.value ? 'text-white/70' : 'text-ink-400',
                )}
              >
                {counts[t.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="search"
            value={q}
            onChange={(e) => changeQ(e.target.value)}
            placeholder="Tìm theo tên, email, SĐT..."
            className="h-10 w-full rounded-[10px] bg-white pl-9 pr-3 text-sm text-ink-900 ring-1 ring-ink-200 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-navy-500"
          />
        </div>
      </div>

      {/* ── Bảng ── */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
            <ShieldCheck className="h-7 w-7 text-ink-400" />
          </div>
          <p className="text-sm font-medium text-ink-700">
            Không có tài khoản nào khớp bộ lọc
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Thử đổi tab trạng thái hoặc xoá từ khoá tìm kiếm.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-ink-200/60 shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-cream-100 text-ink-600">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Nhân viên</th>
                <th className="px-4 py-3 text-left font-medium">Liên hệ</th>
                <th className="px-4 py-3 text-left font-medium">Trạng thái</th>
                <th className="px-4 py-3 text-left font-medium">Ngày tạo</th>
                <th className="px-4 py-3 text-right font-medium w-44">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-ink-100 hover:bg-cream-50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink-900">{s.name}</p>
                    <p className="text-xs text-ink-500">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{s.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {s.isActive ? (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 ring-1 ring-rose-200">
                        Tạm khóa
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-600">
                    {formatDate(s.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <SystemSaleRowActions sale={s} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
