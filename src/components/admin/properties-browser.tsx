'use client';

import { useEffect, useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';

import {
  AdminPropertyCard,
  type AdminPropertyRow,
} from '@/components/admin/admin-property-card';
import {
  PropertyFilters,
  type StatusOption,
} from '@/components/admin/property-filters';
import { ClientPagination } from '@/components/ui/client-pagination';
import type { ModerationStatus } from '@/core/entities/property';
import { MODERATION_STATUS_LABEL } from '@/lib/property-moderation';

type Status = ModerationStatus | '';

const PAGE_SIZE = 12;

export interface PropertiesBrowserInitial {
  status: Status;
  q: string;
  type: string;
  sort: string;
  page: number;
  ownerId?: string;
}

interface Props {
  rows: AdminPropertyRow[];
  apiError: string | null;
  initial: PropertiesBrowserInitial;
}

/**
 * Browser cơ sở (admin) — lọc/tìm/sort/phân trang HOÀN TOÀN client-side trên
 * 1 lần fetch. Đổi tab/tìm/sort/trang không navigate URL ⇒ không re-run Server
 * Component ⇒ không fetch lại BE. URL chỉ đồng bộ qua History API để deep-link
 * (vd dashboard → ?status=pending) và refresh/share vẫn đúng.
 */
export function PropertiesBrowser({ rows, apiError, initial }: Props) {
  const [status, setStatus] = useState<Status>(initial.status);
  const [q, setQ] = useState(initial.q);
  const [type, setType] = useState(initial.type);
  const [sort, setSort] = useState(initial.sort);
  const [page, setPage] = useState(initial.page);
  const [ownerId, setOwnerId] = useState(initial.ownerId ?? '');

  // Đồng bộ URL không gây re-render server (history.replaceState, không router).
  useEffect(() => {
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (sort && sort !== 'name') params.set('sort', sort);
    if (page > 1) params.set('page', String(page));
    if (ownerId) params.set('ownerId', ownerId);
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname,
    );
  }, [status, q, type, sort, page, ownerId]);

  const filteredByOwner = useMemo(() => {
    return ownerId ? rows.filter((r) => r.ownerId === ownerId) : rows;
  }, [rows, ownerId]);

  const ownerName = useMemo(() => {
    if (!ownerId) return '';
    const found = rows.find((r) => r.ownerId === ownerId);
    return found?.ownerName ?? ownerId;
  }, [rows, ownerId]);

  const counts = useMemo(
    () => ({
      total: filteredByOwner.length,
      pending: filteredByOwner.filter((r) => r.moderationStatus === 'pending').length,
      approved: filteredByOwner.filter((r) => r.moderationStatus === 'approved').length,
      rejected: filteredByOwner.filter((r) => r.moderationStatus === 'rejected').length,
      suspended: filteredByOwner.filter((r) => r.moderationStatus === 'suspended').length,
    }),
    [filteredByOwner],
  );

  const filtered = useMemo(() => {
    const qlc = q.trim().toLowerCase();
    const list = filteredByOwner.filter(
      (r) =>
        (status === '' || r.moderationStatus === status) &&
        (type === '' || String(r.type) === type) &&
        (qlc === '' || rowHaystack(r).includes(qlc)),
    );
    return sortRows(list, sort);
  }, [filteredByOwner, status, type, q, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  function changeStatus(s: string) {
    setStatus(s as Status);
    setPage(1);
  }
  function changeType(t: string) {
    setType(t);
    setPage(1);
  }
  function changeSort(s: string) {
    setSort(s);
    setPage(1);
  }
  function changeSearch(value: string) {
    setQ(value);
    setPage(1);
  }
  function reset() {
    setStatus('');
    setQ('');
    setType('');
    setSort('name');
    setPage(1);
    setOwnerId('');
  }

  const statusOptions: StatusOption[] = [
    { key: '', label: 'Tất cả', count: counts.total },
    {
      key: 'approved',
      label: MODERATION_STATUS_LABEL.approved,
      count: counts.approved,
    },
    {
      key: 'rejected',
      label: MODERATION_STATUS_LABEL.rejected,
      count: counts.rejected,
    },
    {
      key: 'suspended',
      label: MODERATION_STATUS_LABEL.suspended,
      count: counts.suspended,
    },
    {
      key: 'pending',
      label: MODERATION_STATUS_LABEL.pending,
      count: counts.pending,
    },
  ];

  return (
    <>
      {apiError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được cơ sở: </span>
          {apiError}
        </div>
      )}

      {ownerId && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-navy-50 px-4 py-2.5 text-sm text-navy-900 ring-1 ring-navy-200">
          <span>
            Đang lọc cơ sở của chủ nhà: <strong>{ownerName}</strong> (ID: {ownerId})
          </span>
          <button
            onClick={() => setOwnerId('')}
            className="text-xs font-semibold text-navy-700 hover:text-navy-900 underline"
          >
            Bỏ lọc
          </button>
        </div>
      )}

      {/* Stat tiles — clickable để lọc nhanh (client state, không navigate) */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile
          label="Tổng cơ sở"
          value={counts.total}
          active={status === ''}
          accent="navy"
          onClick={() => changeStatus('')}
        />
        <StatTile
          label="Đã duyệt"
          value={counts.approved}
          active={status === 'approved'}
          accent="emerald"
          onClick={() => changeStatus('approved')}
        />
        <StatTile
          label="Đã từ chối"
          value={counts.rejected}
          active={status === 'rejected'}
          accent="rose"
          onClick={() => changeStatus('rejected')}
        />
        <StatTile
          label="Đã tạm ngưng"
          value={counts.suspended}
          active={status === 'suspended'}
          accent="ink"
          onClick={() => changeStatus('suspended')}
        />
        <StatTile
          label="Chờ duyệt"
          value={counts.pending}
          active={status === 'pending'}
          accent="amber"
          onClick={() => changeStatus('pending')}
        />
      </div>

      <PropertyFilters
        statuses={statusOptions}
        status={status}
        q={q}
        type={type}
        sort={sort}
        onStatusChange={changeStatus}
        onSearchChange={changeSearch}
        onTypeChange={changeType}
        onSortChange={changeSort}
        onReset={reset}
      />

      {filtered.length === 0 ? (
        <EmptyState hasAny={rows.length > 0} status={status} />
      ) : (
        <>
          <p className="mb-3 text-xs text-ink-500">
            Hiển thị{' '}
            <span className="font-semibold text-ink-700">
              {filtered.length}
            </span>{' '}
            cơ sở
            {filtered.length !== counts.total && ` / ${counts.total} tổng`}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {pageItems.map((r) => (
              <AdminPropertyCard key={r.id} row={r} />
            ))}
          </div>
          <ClientPagination
            currentPage={safePage}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </>
  );
}

function rowHaystack(r: AdminPropertyRow): string {
  return [r.name, r.code, r.address ?? '', r.ownerName ?? '', r.ownerId]
    .join(' ')
    .toLowerCase();
}

function sortRows(list: AdminPropertyRow[], sort: string): AdminPropertyRow[] {
  const sorted = [...list];
  switch (sort) {
    case 'bookings':
      return sorted.sort((a, b) => b.bookingCount - a.bookingCount);
    case 'price-asc':
      return sorted.sort(
        (a, b) => (a.weekdayPrice ?? Infinity) - (b.weekdayPrice ?? Infinity),
      );
    case 'price-desc':
      return sorted.sort((a, b) => (b.weekdayPrice ?? -1) - (a.weekdayPrice ?? -1));
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }
}

// Class phải là literal đầy đủ để Tailwind scanner phát hiện (không ghép động).
const ACCENT_CLASSES: Record<
  string,
  { activeRing: string; hoverRing: string; dot: string; value: string }
> = {
  navy: {
    activeRing: 'ring-2 ring-navy-300',
    hoverRing: 'ring-ink-200/60 hover:ring-navy-300',
    dot: 'bg-navy-700',
    value: 'text-navy-900',
  },
  emerald: {
    activeRing: 'ring-2 ring-emerald-300',
    hoverRing: 'ring-ink-200/60 hover:ring-emerald-300',
    dot: 'bg-emerald-500',
    value: 'text-emerald-700',
  },
  rose: {
    activeRing: 'ring-2 ring-rose-300',
    hoverRing: 'ring-ink-200/60 hover:ring-rose-300',
    dot: 'bg-rose-500',
    value: 'text-rose-700',
  },
  amber: {
    activeRing: 'ring-2 ring-amber-300',
    hoverRing: 'ring-ink-200/60 hover:ring-amber-300',
    dot: 'bg-amber-500',
    value: 'text-amber-700',
  },
  ink: {
    activeRing: 'ring-2 ring-ink-400',
    hoverRing: 'ring-ink-200/60 hover:ring-ink-400',
    dot: 'bg-ink-700',
    value: 'text-ink-800',
  },
};

function StatTile({
  label,
  value,
  active,
  accent,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  accent: keyof typeof ACCENT_CLASSES;
  onClick: () => void;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'group rounded-2xl bg-white p-4 text-left shadow-card ring-1 transition-all hover:-translate-y-0.5 hover:shadow-lg ' +
        (active ? a.activeRing : a.hoverRing)
      }
    >
      <div className="flex items-center gap-1.5">
        <span className={'h-1.5 w-1.5 rounded-full ' + a.dot} />
        <p className="overline muted no-dash text-[10px]">{label}</p>
      </div>
      <p
        className={
          'mt-1.5 font-display text-2xl font-semibold leading-none tracking-tight ' +
          a.value
        }
      >
        {value}
      </p>
    </button>
  );
}

function EmptyState({ hasAny, status }: { hasAny: boolean; status: Status }) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
        <SearchX className="h-7 w-7 text-ink-400" />
      </div>
      <p className="text-sm font-medium text-ink-700">
        {status === ''
          ? 'Không có cơ sở phù hợp'
          : `Không có cơ sở ở trạng thái "${MODERATION_STATUS_LABEL[status]}"`}
      </p>
      <p className="mt-1 text-xs text-ink-500">
        {hasAny
          ? 'Thử bỏ bộ lọc hoặc đổi từ khoá tìm kiếm.'
          : 'Chưa có cơ sở nào trong hệ thống.'}
      </p>
    </div>
  );
}
