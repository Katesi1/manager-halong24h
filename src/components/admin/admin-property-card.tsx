import Image from 'next/image';
import Link from 'next/link';
import { BedDouble, Bath, Building2, ImageOff, MapPin, Users } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { ModerationStatus } from '@/core/entities/property';
import type { VND } from '@/core/value-objects/vnd';
import {
  propertyTypeLabel,
  type PropertyType,
} from '@/core/value-objects/property-type';
import { formatVNDShort } from '@/lib/format';
import {
  MODERATION_STATUS_VARIANT,
  moderationStatusLabel,
} from '@/lib/property-moderation';

/**
 * Shape rút gọn cho list admin — chỉ field card cần. Map từ Property server-side
 * để giảm payload truyền xuống Client Component (bỏ amenities/policies/mô tả…).
 */
export interface AdminPropertyRow {
  id: string;
  name: string;
  code: string;
  type: PropertyType;
  address: string | null;
  ownerId: string;
  ownerName: string | null;
  moderationStatus: ModerationStatus;
  isActive: boolean;
  isHot: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;
  standardGuests: number | null;
  weekdayPrice: VND | null;
  coverUrl: string | null;
  bookingCount: number;
}

export function AdminPropertyCard({ row: p }: { row: AdminPropertyRow }) {
  const ownerLabel = p.ownerName ?? `${p.ownerId.slice(0, 12)}…`;

  return (
    <Link
      href={`/admin/properties/${p.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/60 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-navy-300"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-cream-100">
        {p.coverUrl ? (
          <Image
            src={p.coverUrl}
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
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
          <Badge variant={MODERATION_STATUS_VARIANT[p.moderationStatus]}>
            {moderationStatusLabel(p.moderationStatus)}
          </Badge>
          {p.moderationStatus === 'approved' && !p.isActive && (
            <Badge variant="default">Chủ đang ẩn</Badge>
          )}
        </div>
        <div className="absolute right-2.5 top-2.5 flex flex-col items-end gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <Building2 className="h-3 w-3" />
            {propertyTypeLabel(p.type)}
          </span>
          {p.isHot && (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-500/90 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
              🔥 Hot
            </span>
          )}
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
              Chủ: <span className="font-medium text-ink-600">{ownerLabel}</span>
            </p>
            <p className="text-[11px] text-ink-400">{p.bookingCount} lượt đặt</p>
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
