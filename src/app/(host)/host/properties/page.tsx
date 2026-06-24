import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

import { listPropertiesAction } from '@/app/actions/properties';

export const metadata: Metadata = { title: 'Cơ sở của tôi' };
import { PageHeader } from '@/components/host/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import type { Property } from '@/core/entities/property';
import {
  cancellationPolicyLabel,
  propertyTypeLabel,
} from '@/core/value-objects/property-type';
import { buildPageHref, pageCount, paginate, parsePage } from '@/lib/pagination';

const PAGE_SIZE = 12;

function coverImage(p: Property): string | null {
  return p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl ?? null;
}

export default async function PropertiesListPage(props: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await props.searchParams;
  const result = await listPropertiesAction({ includeInactive: true });
  const properties: Property[] = result.ok ? result.data : [];
  const apiError = !result.ok ? result.error : null;

  const currentPage = parsePage(sp.page);
  const totalPages = pageCount(properties.length, PAGE_SIZE);
  const pageItems = paginate(properties, currentPage, PAGE_SIZE);

  function pageHref(page: number) {
    return buildPageHref('/host/properties', {
      page: page > 1 ? String(page) : undefined,
    });
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Cơ sở của tôi"
        description="Quản lý villa, homestay, khách sạn bạn đang vận hành."
        actions={
          <Link href="/host/properties/new">
            <Button>+ Thêm cơ sở</Button>
          </Link>
        }
      />

      {apiError && (
        <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span className="font-semibold">Tạm thời không tải được dữ liệu: </span>
          {apiError}
        </div>
      )}

      {properties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-200 bg-white p-12 text-center">
          <p className="text-2xl">🏡</p>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-navy-900">
            Bạn chưa có cơ sở nào
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            Thêm cơ sở đầu tiên để bắt đầu bán phòng trên Halong24h.
          </p>
          <Link href="/host/properties/new" className="mt-5 inline-block">
            <Button>+ Thêm cơ sở đầu tiên</Button>
          </Link>
        </div>
      ) : (
        <>
        <div className="grid gap-4 md:grid-cols-2">
          {pageItems.map((p) => {
            const cover = coverImage(p);
            return (
              <Link
                key={p.id}
                href={`/host/properties/${p.id}`}
                className="group flex gap-4 rounded-2xl bg-white p-3 ring-1 ring-ink-200/60 shadow-card hover:ring-ink-300 transition-all"
              >
                <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl bg-ink-100">
                  {cover && (
                    <Image
                      src={cover}
                      alt={p.name}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-ink-900 line-clamp-1 group-hover:text-navy-700">
                      {p.name}
                    </h3>
                    <Badge variant={p.isActive ? 'success' : 'default'}>
                      {p.isActive ? 'Đang bật' : 'Tạm tắt'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {p.address ?? 'Hạ Long'} · {propertyTypeLabel(p.type)}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                    <span className="text-xs text-ink-700">
                      🛏️ {p.bedrooms ?? '-'} phòng ngủ · 👥 tối đa {p.maxGuests ?? '-'}
                    </span>
                    {p.cancellationPolicy !== null &&
                      p.cancellationPolicy !== undefined && (
                        <Badge variant="default">
                          {cancellationPolicyLabel(p.cancellationPolicy)}
                        </Badge>
                      )}
                    <span className="ml-auto text-xs font-mono text-ink-500">
                      {p.code}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={properties.length}
          pageSize={PAGE_SIZE}
          buildHref={pageHref}
        />
        </>
      )}
    </div>
  );
}
