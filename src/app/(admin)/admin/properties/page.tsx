import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  BedDouble,
  Bath,
  Building2,
  ImageOff,
  MapPin,
  SearchX,
  Users,
} from 'lucide-react';

import { listPropertiesAction } from '@/app/actions/properties';
import {
  PropertyFilters,
  type StatusOption,
} from '@/components/admin/property-filters';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/core/entities/property';
import { propertyTypeLabel } from '@/core/value-objects/property-type';
import { formatVNDShort } from '@/lib/format';

export const metadata: Metadata = { title: 'Cơ sở (toàn hệ thống)' };

/**
 * Property moderation (BE chỉ có isActive boolean, chưa có moderationStatus):
 *  - "Chờ duyệt" = isActive=false AND bookingCount=0 (proxy: mới tạo)
 *  - "Đã duyệt" = isActive=true
 *  - "Tạm khoá" = isActive=false AND bookingCount>0 (đã từng active → bị khoá)
 */
type Status = 'pending' | 'active' | 'suspended' | '';

function coverImage(p: Property): string | null {
  return (
    p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl ?? null
  );
}

function isPending(p: Property): boolean {
  return !p.isActive && p.bookingCount === 0;
}
function isSuspended(p: Property): boolean {
  return !p.isActive && p.bookingCount > 0;
}

function matchesStatus(p: Property, status: Status): boolean {
  if (status === 'pending') return isPending(p);
  if (status === 'active') return p.isActive;
  if (status === 'suspended') return isSuspended(p);
  return true;
}

function matchesQuery(p: Property, q: string): boolean {
  if (!q) return true;
  const haystack = [
    p.name,
    p.code,
    p.address ?? '',
    p.owner?.name ?? '',
    p.owner?.phone ?? '',
    p.ownerId,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function sortProperties(list: Property[], sort: string): Property[] {
  const sorted = [...list];
  switch (sort) {
    case 'bookings':
      return sorted.sort((a, b) => b.bookingCount - a.bookingCount);
    case 'price-asc':
      return sorted.sort(
        (a, b) => (a.weekdayPrice ?? Infinity) - (b.weekdayPrice ?? Infinity),
      );
    case 'price-desc':
      return sorted.sort(
        (a, b) => (b.weekdayPrice ?? -1) - (a.weekdayPrice ?? -1),
      );
    default:
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  }
}

export default async function AdminPropertiesPage(props: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    type?: string;
    sort?: string;
  }>;
}) {
  const sp = await props.searchParams;
  const status: Status = (
    ['pending', 'active', 'suspended'].includes(sp.status ?? '')
      ? sp.status
      : ''
  ) as Status;
  const q = (sp.q ?? '').trim().toLowerCase();
  const typeFilter = sp.type ?? '';
  const sort = sp.sort ?? 'name';

  const result = await listPropertiesAction({ includeInactive: true });
  const all: Property[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const counts = {
    total: all.length,
    active: all.filter((p) => p.isActive).length,
    pending: all.filter(isPending).length,
    suspended: all.filter(isSuspended).length,
  };

  const filtered = sortProperties(
    all.filter(
      (p) =>
        matchesStatus(p, status) &&
        matchesQuery(p, q) &&
        (typeFilter === '' || String(p.type) === typeFilter),
    ),
    sort,
  );

  const statusOptions: StatusOption[] = [
    { key: '', label: 'Tất cả', count: counts.total },
    { key: 'pending', label: 'Chờ duyệt', count: counts.pending },
    { key: 'active', label: 'Đã duyệt', count: counts.active },
    { key: 'suspended', label: 'Tạm khoá', count: counts.suspended },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Cơ sở (toàn hệ thống)"
        description="Duyệt cơ sở mới · Tạm khoá cơ sở vi phạm · Theo dõi hoạt động."
        actions={
          counts.pending > 0 ? (
            <Link
              href="/admin/properties?status=pending"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-gold-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-gold-600"
            >
              ⏳ {counts.pending} chờ duyệt
            </Link>
          ) : null
        }
      />

      {apiError && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200"
        >
          <span className="font-semibold">Không tải được cơ sở: </span>
          {apiError}
        </div>
      )}

      {/* Stat summary — clickable để lọc nhanh */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Tổng cơ sở"
          value={counts.total}
          href="/admin/properties"
          active={status === ''}
          accent="navy"
        />
        <StatTile
          label="Đã duyệt"
          value={counts.active}
          href="/admin/properties?status=active"
          active={status === 'active'}
          accent="emerald"
        />
        <StatTile
          label="Chờ duyệt"
          value={counts.pending}
          href="/admin/properties?status=pending"
          active={status === 'pending'}
          accent="gold"
        />
        <StatTile
          label="Tạm khoá"
          value={counts.suspended}
          href="/admin/properties?status=suspended"
          active={status === 'suspended'}
          accent="rose"
        />
      </div>

      <PropertyFilters
        statuses={statusOptions}
        status={status}
        q={sp.q ?? ''}
        type={typeFilter}
        sort={sort}
      />

      {filtered.length === 0 ? (
        <EmptyState filtered={all.length > 0} status={status} />
      ) : (
        <>
          <p className="mb-3 text-xs text-ink-500">
            Hiển thị{' '}
            <span className="font-semibold text-ink-700">{filtered.length}</span>{' '}
            cơ sở
            {filtered.length !== counts.total && ` / ${counts.total} tổng`}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Lưu ý: class phải là chuỗi literal đầy đủ để Tailwind scanner phát hiện —
// KHÔNG ghép động kiểu `'hover:' + ring` (sẽ không sinh ra CSS).
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
  gold: {
    activeRing: 'ring-2 ring-gold-400',
    hoverRing: 'ring-ink-200/60 hover:ring-gold-400',
    dot: 'bg-gold-500',
    value: 'text-gold-700',
  },
  rose: {
    activeRing: 'ring-2 ring-rose-300',
    hoverRing: 'ring-ink-200/60 hover:ring-rose-300',
    dot: 'bg-rose-500',
    value: 'text-rose-700',
  },
};

function StatTile({
  label,
  value,
  href,
  active,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  active: boolean;
  accent: keyof typeof ACCENT_CLASSES;
}) {
  const a = ACCENT_CLASSES[accent];
  return (
    <Link
      href={href}
      className={
        'group rounded-2xl bg-white p-4 shadow-card ring-1 transition-all hover:-translate-y-0.5 hover:shadow-lg ' +
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
    </Link>
  );
}

function PropertyCard({ property: p }: { property: Property }) {
  const cover = coverImage(p);
  const pending = isPending(p);
  const suspended = isSuspended(p);
  const ownerLabel = p.owner?.name ?? `${p.ownerId.slice(0, 12)}…`;

  return (
    <Link
      href={`/admin/properties/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-navy-300"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-100">
        {cover ? (
          <Image
            src={cover}
            alt={p.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-ink-300">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-2.5 top-2.5">
          {pending ? (
            <Badge variant="gold">⏳ Chờ duyệt</Badge>
          ) : suspended ? (
            <Badge variant="danger">🔒 Tạm khoá</Badge>
          ) : (
            <Badge variant="success">✓ Đã duyệt</Badge>
          )}
        </div>
        <div className="absolute right-2.5 top-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Building2 className="h-3 w-3" />
            {propertyTypeLabel(p.type)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ink-900 group-hover:text-navy-700">
            {p.name}
          </h3>
          <span className="shrink-0 rounded bg-cream-100 px-1.5 py-0.5 font-mono text-[10px] text-ink-500">
            {p.code}
          </span>
        </div>

        <p className="mt-1 flex items-center gap-1 text-xs text-ink-500">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{p.address ?? 'Hạ Long'}</span>
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-600">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5 text-ink-400" />
            {p.bedrooms ?? '-'} phòng
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5 text-ink-400" />
            {p.bathrooms ?? '-'} WC
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-ink-400" />
            {p.maxGuests ?? p.standardGuests ?? '-'} khách
          </span>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-ink-100 pt-3">
          <div className="min-w-0">
            <p className="truncate text-[11px] text-ink-400">
              Chủ:{' '}
              <span className="font-medium text-ink-600">{ownerLabel}</span>
            </p>
            <p className="text-[11px] text-ink-400">
              {p.bookingCount} lượt đặt
            </p>
          </div>
          {p.weekdayPrice != null && (
            <p className="shrink-0 text-right">
              <span className="font-display text-base font-semibold text-navy-900">
                {formatVNDShort(p.weekdayPrice)}
              </span>
              <span className="text-[11px] text-ink-400"> /đêm</span>
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function EmptyState({
  filtered,
  status,
}: {
  filtered: boolean;
  status: Status;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-200">
        <SearchX className="h-7 w-7 text-ink-400" />
      </div>
      <p className="text-sm font-medium text-ink-700">
        {status === 'pending'
          ? 'Không có cơ sở chờ duyệt'
          : 'Không có cơ sở phù hợp'}
      </p>
      <p className="mt-1 text-xs text-ink-500">
        {status === 'pending'
          ? 'Mọi cơ sở đều đã được xử lý.'
          : filtered
            ? 'Thử bỏ bộ lọc hoặc đổi từ khoá tìm kiếm.'
            : 'Chưa có cơ sở nào trong hệ thống.'}
      </p>
    </div>
  );
}
