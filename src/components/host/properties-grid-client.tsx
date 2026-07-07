'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientPagination } from '@/components/ui/client-pagination';
import type { Property } from '@/core/entities/property';
import {
  cancellationPolicyLabel,
  propertyTypeLabel,
} from '@/core/value-objects/property-type';
import {
  MODERATION_STATUS_VARIANT,
  moderationStatusLabel,
} from '@/lib/property-moderation';

const PAGE_SIZE = 12;

function coverImage(p: Property): string | null {
  return (
    p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl ?? null
  );
}

interface LoadState {
  loading: boolean;
  error: string | null;
  properties: Property[];
}

/**
 * Lưới cơ sở fetch từ `/api/properties` PHÍA CLIENT → endpoint hiện trong F12
 * Network (cùng origin, token vẫn ở server). Phân trang in-memory.
 */
export function PropertiesGridClient() {
  const [state, setState] = useState<LoadState>({
    loading: true,
    error: null,
    properties: [],
  });
  const [page, setPage] = useState(1);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/properties', { credentials: 'same-origin' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json.error || 'Không tải được danh sách');
        return json.data as Property[];
      })
      .then((data) => {
        if (!cancelled) {
          setState({ loading: false, error: null, properties: data ?? [] });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setState({
            loading: false,
            error:
              err instanceof Error ? err.message : 'Không tải được danh sách',
            properties: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="py-12 text-center text-sm text-ink-500">Đang tải…</div>
    );
  }

  if (state.error) {
    return (
      <div className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <span className="font-semibold">Tạm thời không tải được dữ liệu: </span>
        {state.error}
      </div>
    );
  }

  if (state.properties.length === 0) {
    return (
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
    );
  }

  const totalPages = Math.ceil(state.properties.length / PAGE_SIZE);
  const pageItems = state.properties.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  return (
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
                  {p.moderationStatus === 'approved' ? (
                    <Badge variant={p.isActive ? 'success' : 'default'}>
                      {p.isActive ? 'Đang bật' : 'Tạm tắt'}
                    </Badge>
                  ) : (
                    <Badge variant={MODERATION_STATUS_VARIANT[p.moderationStatus]}>
                      {moderationStatusLabel(p.moderationStatus)}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-ink-500">
                  {p.address ?? 'Hạ Long'} · {propertyTypeLabel(p.type)}
                </p>
                {p.moderationStatus === 'rejected' &&
                  p.moderationRejectedReason && (
                    <p className="mt-1 text-xs text-rose-700">
                      Lý do từ chối: {p.moderationRejectedReason}
                    </p>
                  )}
                <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-ink-700">
                    🛏️ {p.bedrooms ?? '-'} phòng ngủ · 👥 tối đa{' '}
                    {p.maxGuests ?? '-'}
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
      <ClientPagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={state.properties.length}
        pageSize={PAGE_SIZE}
      />
    </>
  );
}
