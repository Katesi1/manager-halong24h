import { cn } from '@/lib/utils';

const AMENITY_LABEL: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'Wifi', icon: '📶' },
  pool: { label: 'Bể bơi', icon: '🏊' },
  seaview: { label: 'View biển', icon: '🌊' },
  cityview: { label: 'View thành phố', icon: '🏙️' },
  parking: { label: 'Đỗ xe', icon: '🅿️' },
  ac: { label: 'Điều hòa', icon: '❄️' },
  bbq: { label: 'BBQ ngoài trời', icon: '🍖' },
  kitchen: { label: 'Bếp đầy đủ', icon: '🍳' },
  washer: { label: 'Máy giặt', icon: '🧺' },
  tv: { label: 'TV', icon: '📺' },
  balcony: { label: 'Ban công', icon: '🏞️' },
  pet: { label: 'Cho phép thú cưng', icon: '🐾' },
  smoking: { label: 'Khu vực hút thuốc', icon: '🚬' },
  gym: { label: 'Phòng gym', icon: '🏋️' },
  spa: { label: 'Spa', icon: '💆' },
  // New amenities
  karaoke: { label: 'Karaoke', icon: '🎤' },
  portable_speaker: { label: 'Loa di động', icon: '🔊' },
  refrigerator: { label: 'Tủ lạnh', icon: '🧊' },
  microwave: { label: 'Lò vi sóng', icon: '🎛️' },
  induction_stove: { label: 'Bếp từ', icon: '⚡' },
  dishes: { label: 'Bát đũa', icon: '🥣' },
  free_water: { label: 'Nước lọc free', icon: '🥛' },
  bathtub: { label: 'Bồn tắm', icon: '🛁' },
  shower: { label: 'Vòi sen', icon: '🚿' },
  hot_water: { label: 'Nước nóng', icon: '♨️' },
  hair_dryer: { label: 'Máy sấy tóc', icon: '💨' },
  heating_lamp: { label: 'Đèn sưởi', icon: '💡' },
  towels: { label: 'Khăn tắm', icon: '🧼' },
  toiletries: { label: 'Dầu gội/Sữa tắm', icon: '🧴' },
  garden: { label: 'Sân vườn', icon: '🌳' },
  rooftop: { label: 'Sân thượng', icon: '🌇' },
  iron: { label: 'Bàn là', icon: '👔' },
  wardrobe: { label: 'Tủ quần áo', icon: '👗' },
  safe: { label: 'Két sắt', icon: '🔒' },
  elevator: { label: 'Thang máy', icon: '🛗' },
  billiards: { label: 'Bida', icon: '🎱' },
  pingpong: { label: 'Bàn bóng bàn', icon: '🏓' },
  swing: { label: 'Xích đu', icon: '🎠' },
  playground: { label: 'Khu vui chơi trẻ em', icon: '🛝' },
  // Legacy / Other
  kitchenette: { label: 'Bếp nhỏ', icon: '🍳' },
  breakfast: { label: 'Bữa sáng', icon: '🍳' },
  workspace: { label: 'Bàn làm việc', icon: '💼' },
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
      {items.map((rawKey) => {
        const key = rawKey.trim();
        const normalizedKey = key.toLowerCase();

        let meta = AMENITY_LABEL[normalizedKey];
        if (!meta) {
          const found = Object.values(AMENITY_LABEL).find(
            (val) => val.label.toLowerCase() === normalizedKey
          );
          if (found) {
            meta = found;
          }
        }

        const displayLabel = meta ? meta.label : rawKey;
        const displayIcon = meta ? meta.icon : '✓';

        return (
          <li
            key={rawKey}
            className="flex items-center gap-2.5 text-sm text-ink-700"
          >
            <span className="text-base" aria-hidden>
              {displayIcon}
            </span>
            <span>{displayLabel}</span>
          </li>
        );
      })}
    </ul>
  );
}
