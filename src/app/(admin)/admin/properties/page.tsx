import Image from 'next/image';
import Link from 'next/link';

import { listPropertiesAction } from '@/app/actions/properties';
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/core/entities/property';
import { propertyTypeLabel } from '@/core/value-objects/property-type';

/**
 * Property moderation (BE chỉ có isActive boolean, chưa có moderationStatus):
 *  - "Chờ duyệt" = isActive=false AND bookingCount=0 (proxy: mới tạo)
 *  - "Đã duyệt" = isActive=true
 *  - "Tạm khoá" = isActive=false AND bookingCount>0 (đã từng active → bị khoá)
 */
type Tab = 'pending' | 'active' | 'suspended' | '';

const TABS: { key: Tab; label: string }[] = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'active', label: 'Đã duyệt' },
  { key: 'suspended', label: 'Tạm khoá' },
];

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

export default async function AdminPropertiesPage(props: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await props.searchParams;
  const tab: Tab = (sp.status as Tab) ?? '';
  const result = await listPropertiesAction({ includeInactive: true });
  const all: Property[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const filtered =
    tab === 'pending'
      ? all.filter(isPending)
      : tab === 'active'
        ? all.filter((p) => p.isActive)
        : tab === 'suspended'
          ? all.filter(isSuspended)
          : all;

  const pendingCount = all.filter(isPending).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        eyebrow="Vận hành hệ thống"
        title="Cơ sở (toàn hệ thống)"
        description="Duyệt cơ sở mới · Tạm khoá cơ sở vi phạm · Theo dõi hoạt động."
        actions={
          pendingCount > 0 ? (
            <Link
              href="/admin/properties?status=pending"
              className="inline-flex h-10 items-center gap-2 rounded-[10px] bg-gold-500 px-4 text-sm font-semibold text-white hover:bg-gold-600"
            >
              ⏳ {pendingCount} chờ duyệt
            </Link>
          ) : null
        }
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Không tải được cơ sở: </span>
          {apiError}
        </div>
      )}

      <div className="mb-5 flex flex-wrap gap-2 border-b border-ink-200">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <Link
              key={t.key}
              href={
                t.key
                  ? `/admin/properties?status=${t.key}`
                  : '/admin/properties'
              }
              className={
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors ' +
                (active
                  ? 'border-navy-900 text-navy-900'
                  : 'border-transparent text-ink-500 hover:text-navy-900')
              }
            >
              {t.label}
              {t.key === 'pending' && pendingCount > 0 && (
                <span className="ml-1.5 rounded-full bg-gold-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center text-ink-500">
          {tab === 'pending'
            ? 'Không có cơ sở chờ duyệt — mọi cơ sở đều đã xử lý.'
            : 'Không có cơ sở phù hợp.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => {
            const cover = coverImage(p);
            const pending = isPending(p);
            const suspended = isSuspended(p);
            return (
              <Link
                key={p.id}
                href={`/admin/properties/${p.id}`}
                className="group flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-ink-200/60 shadow-card hover:ring-navy-300 transition-all"
              >
                <div className="relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-xl bg-cream-100">
                  {cover && (
                    <Image
                      src={cover}
                      alt={p.name}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink-900 group-hover:text-navy-700 line-clamp-1">
                      {p.name}
                    </h3>
                    {pending ? (
                      <Badge variant="gold">⏳ Chờ duyệt</Badge>
                    ) : suspended ? (
                      <Badge variant="danger">🔒 Tạm khoá</Badge>
                    ) : (
                      <Badge variant="success">✓ Đã duyệt</Badge>
                    )}
                  </div>
                  <p className="text-xs text-ink-500 mt-0.5">
                    Chủ sở hữu:{' '}
                    <span className="font-mono text-ink-700">
                      {p.ownerId.slice(0, 12)}…
                    </span>{' '}
                    · {p.address ?? 'Hạ Long'}
                  </p>
                  <p className="mt-1 text-xs text-ink-500">
                    🏠 {propertyTypeLabel(p.type)} · 🛏️ {p.bedrooms ?? '-'} phòng
                    ngủ · {p.bookingCount} lượt đặt
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
