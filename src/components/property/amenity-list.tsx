import { cn } from '@/lib/utils';

const AMENITY_LABEL: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'Wi-Fi miễn phí', icon: '📶' },
  pool: { label: 'Hồ bơi', icon: '🏊' },
  seaview: { label: 'View biển', icon: '🌊' },
  cityview: { label: 'View thành phố', icon: '🏙️' },
  parking: { label: 'Bãi đỗ xe', icon: '🅿️' },
  ac: { label: 'Điều hòa', icon: '❄️' },
  bbq: { label: 'BBQ', icon: '🍖' },
  kitchen: { label: 'Bếp', icon: '🍳' },
  washer: { label: 'Máy giặt', icon: '🧺' },
  tv: { label: 'TV', icon: '📺' },
  balcony: { label: 'Ban công', icon: '🏞️' },
  pet: { label: 'Cho phép thú cưng', icon: '🐾' },
  smoking: { label: 'Khu vực hút thuốc', icon: '🚬' },
  gym: { label: 'Phòng gym', icon: '🏋️' },
  spa: { label: 'Spa', icon: '💆' },
};

interface AmenityListProps {
  items: string[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function AmenityList({ items, columns = 2, className }: AmenityListProps) {
  if (!items || items.length === 0) {
    return <p className="text-sm text-ink-500">Chưa có thông tin tiện ích</p>;
  }

  const gridCls = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <ul className={cn('grid gap-3', gridCls, className)}>
      {items.map((key) => {
        const meta = AMENITY_LABEL[key] ?? { label: key, icon: '✓' };
        return (
          <li
            key={key}
            className="flex items-center gap-2.5 text-sm text-ink-700"
          >
            <span className="text-base" aria-hidden>
              {meta.icon}
            </span>
            <span>{meta.label}</span>
          </li>
        );
      })}
    </ul>
  );
}
