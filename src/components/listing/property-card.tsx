import Image from 'next/image';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import type { BookingMode } from '@/lib/legacy-types';
import { formatVND } from '@/lib/format';

export interface PropertyCardData {
  id: string;
  name: string;
  slug: string;
  city?: string;
  district?: string;
  cover_image_url: string | null;
  images?: string[];
  amenities: string[];
  booking_mode: BookingMode;
  minPrice?: number;
  rating?: number;
  reviewCount?: number;
  locationText?: string;
  isGuestFavorite?: boolean;
}

interface PropertyCardProps {
  data: PropertyCardData;
  priority?: boolean;
}

export function PropertyCard({ data, priority }: PropertyCardProps) {
  const cover = data.cover_image_url ?? data.images?.[0] ?? null;
  return (
    <Link
      href={`/property/${data.slug}`}
      className="group flex flex-col gap-3 overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-ink-100">
        {cover && (
          <Image
            src={cover}
            alt={data.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {data.isGuestFavorite && (
          <div className="absolute left-3 top-3">
            <Badge variant="gold">★ Khách yêu thích</Badge>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ink-900 group-hover:underline">
            {data.name}
          </h3>
          {data.rating !== undefined && (
            <span className="shrink-0 text-sm font-semibold text-ink-900">
              ★ {data.rating.toFixed(2)}
            </span>
          )}
        </div>
        {data.locationText && (
          <p className="line-clamp-1 text-sm text-ink-500">{data.locationText}</p>
        )}
        {data.minPrice !== undefined && (
          <p className="mt-1 text-sm text-ink-700">
            <span className="font-semibold text-ink-900">{formatVND(data.minPrice)}</span>
            {' '}/ đêm
          </p>
        )}
      </div>
    </Link>
  );
}
