'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Anchor, Plus, Search, Ship } from 'lucide-react';

import { StatCard } from '@/components/host/page-header';
import { Button } from '@/components/ui/button';
import { ClientPagination } from '@/components/ui/client-pagination';
import type { Yacht } from '@/core/entities/yacht';
import { formatVND } from '@/core/value-objects/vnd';
import { useApiResource } from '@/lib/use-api-resource';

const PAGE_SIZE = 12;

type Tab = 'all' | 'active' | 'inactive';

export function YachtsBrowser() {
  const { loading, error, data } = useApiResource<Yacht[]>('/api/admin/yachts');
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);

  const all = useMemo(() => data ?? [], [data]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return all.filter((y) => {
      if (tab === 'active' && !y.isActive) return false;
      if (tab === 'inactive' && y.isActive) return false;
      if (!query) return true;
      return (
        y.name.toLowerCase().includes(query) ||
        y.code.toLowerCase().includes(query) ||
        (y.shipType ?? '').toLowerCase().includes(query)
      );
    });
  }, [all, tab, q]);

  if (loading) {
    return <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>;
  }
  if (error) {
    return (
      <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Không tải được danh sách du thuyền: </span>
        {error}
      </div>
    );
  }

  const activeCount = all.filter((y) => y.isActive).length;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'all', label: 'Tất cả', count: all.length },
    { key: 'active', label: 'Đang hoạt động', count: activeCount },
    { key: 'inactive', label: 'Đã ẩn', count: all.length - activeCount },
  ];

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Tổng du thuyền" value={String(all.length)} hint="trên hệ thống" />
        <StatCard label="Đang hoạt động" value={String(activeCount)} hint="hiển thị cho khách" />
        <StatCard label="Tổng lượt đặt" value={String(all.reduce((s, y) => s + y.bookingCount, 0))} hint="cộng dồn" />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key);
                setPage(1);
              }}
              className={
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ' +
                (tab === t.key
                  ? 'bg-navy-900 text-cream-50'
                  : 'bg-white text-ink-700 ring-1 ring-ink-200/70 hover:bg-cream-100')
              }
            >
              {t.label}
              <span className={tab === t.key ? 'text-cream-50/80' : 'text-ink-400'}>{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên / mã / loại tàu"
            className="h-10 w-64 rounded-lg border border-ink-200 bg-white pl-9 pr-3 text-sm focus:border-ink-900 focus:outline-none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <Ship className="mx-auto h-10 w-10 text-ink-300" />
          <p className="mt-3 font-medium text-ink-900">
            {all.length === 0 ? 'Chưa có du thuyền nào' : 'Không tìm thấy du thuyền phù hợp'}
          </p>
          {all.length === 0 && (
            <Link href="/admin/yachts/new" className="mt-4 inline-flex">
              <Button>
                <Plus className="h-4 w-4" /> Thêm du thuyền
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((y) => (
            <YachtCard key={y.id} yacht={y} />
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <ClientPagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={filtered.length}
          pageSize={PAGE_SIZE}
        />
      )}
    </>
  );
}

function YachtCard({ yacht }: { yacht: Yacht }) {
  const cover = yacht.images.find((i) => i.isCover) ?? yacht.images[0];
  return (
    <Link
      href={`/admin/yachts/${yacht.id}`}
      className="group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60 transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-[16/10] bg-ink-100">
        {cover ? (
          <Image src={cover.imageUrl} alt={yacht.name} fill sizes="(max-width:768px) 100vw, 33vw" className="object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-ink-300">
            <Anchor className="h-10 w-10" />
          </div>
        )}
        <span
          className={
            'absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ' +
            (yacht.isActive
              ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
              : 'bg-ink-100 text-ink-600 ring-ink-200')
          }
        >
          {yacht.isActive ? 'Hoạt động' : 'Đã ẩn'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate font-semibold text-navy-900 group-hover:underline">{yacht.name}</h3>
          <span className="shrink-0 rounded bg-cream-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">{yacht.code}</span>
        </div>
        <p className="mt-1 truncate text-xs text-ink-500">
          {[yacht.shipType, yacht.durationText, yacht.cabins ? `${yacht.cabins} cabin` : null]
            .filter(Boolean)
            .join(' · ') || 'Chưa có thông số'}
        </p>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="font-semibold text-navy-900">
            từ {formatVND(yacht.weekdayPrice)}
            <span className="text-xs font-normal text-ink-500">/khách</span>
          </span>
          <span className="text-xs text-ink-500">{yacht.bookingCount} lượt đặt</span>
        </div>
      </div>
    </Link>
  );
}
