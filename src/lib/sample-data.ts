import type { PropertyCardData } from '@/components/listing/property-card';
import type { BookingMode } from './database.types';

export interface SamplePropertyDetail {
  id: string;
  name: string;
  slug: string;
  city: string;
  district: string;
  address: string;
  description: string;
  amenities: string[];
  check_in_time: string;
  check_out_time: string;
  cancel_policy: string;
  house_rules: string;
  booking_mode: BookingMode;
  cover_image_url: string;
  images: string[];
  reviews: {
    id: string;
    rating: number;
    comment: string;
    customer: { full_name: string; avatar_url?: string };
    created_at: string;
    owner_reply?: string;
  }[];
  host: {
    full_name: string;
    avatar_url?: string;
    member_since: string;
    properties_count: number;
    response_rate: number;
    response_time: string;
  };
  rating: number;
  reviewCount: number;
  isGuestFavorite?: boolean;
  lat: number;
  lng: number;
}

/** Sample property data dùng khi Supabase chưa cấu hình.
 *  Để demo UI render đẹp ngay từ đầu, không cần phải seed DB trước.
 *  Khi Supabase đã cấu hình thật, các page sẽ query thay vì dùng sample này. */
export const SAMPLE_PROPERTIES: PropertyCardData[] = [
  {
    id: 'sample-1',
    name: 'À La Carte Hạ Long Bay',
    slug: 'a-la-carte-ha-long-bay',
    city: 'Hạ Long',
    district: 'Bãi Cháy',
    cover_image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
    ],
    amenities: ['seaview', 'pool', 'wifi', 'parking'],
    booking_mode: 'lead_and_pay',
    minPrice: 1850000,
    rating: 4.92,
    reviewCount: 128,
    locationText: 'Bãi Cháy, Hạ Long · 200m từ bãi tắm',
    isGuestFavorite: true,
  },
  {
    id: 'sample-2',
    name: 'Sun Grand City Feria — HD7-28',
    slug: 'sun-grand-feria-hd7',
    city: 'Hạ Long',
    district: 'Hùng Thắng',
    cover_image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
    ],
    amenities: ['pool', 'wifi', 'ac', 'parking'],
    booking_mode: 'lead_and_pay',
    minPrice: 1200000,
    rating: 4.85,
    reviewCount: 86,
    locationText: 'Sun Grand City Feria · 5p đi bộ ra biển',
    isGuestFavorite: true,
  },
  {
    id: 'sample-3',
    name: 'Seaside Luxury Villa',
    slug: 'seaside-luxury-villa',
    city: 'Hạ Long',
    district: 'Tuần Châu',
    cover_image_url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    ],
    amenities: ['seaview', 'pool', 'bbq', 'parking'],
    booking_mode: 'lead_only',
    minPrice: 4500000,
    rating: 4.96,
    reviewCount: 42,
    locationText: 'Tuần Châu · Villa 5PN, hồ bơi riêng',
  },
  {
    id: 'sample-4',
    name: 'Sun Plaza — Studio View Vịnh',
    slug: 'sun-plaza-studio',
    city: 'Hạ Long',
    district: 'Bãi Cháy',
    cover_image_url: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    ],
    amenities: ['wifi', 'ac', 'seaview'],
    booking_mode: 'lead_and_pay',
    minPrice: 680000,
    rating: 4.78,
    reviewCount: 215,
    locationText: 'Sun Plaza · 12p đến Bến tàu',
  },
  {
    id: 'sample-5',
    name: 'Halong Heritage Boutique',
    slug: 'halong-heritage-boutique',
    city: 'Hạ Long',
    district: 'Hồng Hà',
    cover_image_url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1200&q=80',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80',
    ],
    amenities: ['breakfast', 'wifi', 'parking'],
    booking_mode: 'lead_only',
    minPrice: 950000,
    rating: 4.81,
    reviewCount: 64,
    locationText: 'Hồng Hà · Gần chợ đêm',
  },
  {
    id: 'sample-6',
    name: 'Vinhomes Dragon Bay 4PN',
    slug: 'vinhomes-dragon-bay',
    city: 'Hạ Long',
    district: 'Hùng Thắng',
    cover_image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1200&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80',
    ],
    amenities: ['pool', 'kitchen', 'parking', 'bbq'],
    booking_mode: 'lead_and_pay',
    minPrice: 2800000,
    rating: 4.89,
    reviewCount: 31,
    locationText: 'Vinhomes Dragon Bay · 4PN · Hồ bơi nội khu',
  },
  {
    id: 'sample-7',
    name: 'Deluxe Apartment — Citadines',
    slug: 'deluxe-citadines',
    city: 'Hạ Long',
    district: 'Hùng Thắng',
    cover_image_url: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1200&q=80',
    ],
    amenities: ['wifi', 'pool', 'gym'],
    booking_mode: 'lead_and_pay',
    minPrice: 1100000,
    rating: 4.74,
    reviewCount: 152,
    locationText: 'Citadines · Tòa căn hộ dịch vụ 4 sao',
  },
  {
    id: 'sample-8',
    name: 'Mộc Homestay — Phong cách Bắc Bộ',
    slug: 'moc-homestay',
    city: 'Hạ Long',
    district: 'Yên Hưng',
    cover_image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&q=80',
    ],
    amenities: ['breakfast', 'wifi', 'kitchen'],
    booking_mode: 'lead_only',
    minPrice: 420000,
    rating: 4.95,
    reviewCount: 89,
    locationText: 'Yên Hưng · Homestay vintage gỗ',
    isGuestFavorite: true,
  },
];

/** Map slug → SamplePropertyDetail */
export const SAMPLE_PROPERTY_DETAILS: Record<string, SamplePropertyDetail> = {
  'a-la-carte-ha-long-bay': {
    id: 'sample-1',
    name: 'À La Carte Hạ Long Bay',
    slug: 'a-la-carte-ha-long-bay',
    city: 'Hạ Long',
    district: 'Bãi Cháy',
    address: '1 Đường Hoàng Quốc Việt, Bãi Cháy',
    description:
      'À La Carte Hạ Long Bay là tổ hợp căn hộ dịch vụ cao cấp 5 sao bên Vịnh Hạ Long. Tòa nhà 36 tầng với hồ bơi tầng cao, sky bar view 360°, và các căn hộ studio - 2PN trang bị đầy đủ. Cách bãi tắm Bãi Cháy 200m, gần cáp treo Nữ Hoàng và bến tàu Tuần Châu.',
    amenities: ['seaview', 'pool', 'wifi', 'parking', 'ac', 'kitchen', 'gym', 'spa', 'bbq', 'breakfast'],
    check_in_time: '14:00',
    check_out_time: '12:00',
    cancel_policy: 'Hủy miễn phí trong vòng 48h sau khi đặt. Sau đó hoàn 50% nếu hủy trước 7 ngày, không hoàn tiền nếu hủy muộn hơn.',
    house_rules: 'Không hút thuốc trong phòng. Không tổ chức tiệc/sự kiện. Vật nuôi không được phép. Thân thiện với gia đình có trẻ em.',
    booking_mode: 'lead_and_pay',
    cover_image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=1600&q=85',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=1600&q=85',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1600&q=85',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=1600&q=85',
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=1600&q=85',
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=85',
    ],
    reviews: [
      {
        id: 'r-1',
        rating: 5,
        comment:
          'Phòng siêu đẹp, view vịnh trực diện. Chủ nhà nhiệt tình, check-in nhanh. Hồ bơi tầng cao là điểm cộng lớn. Sẽ quay lại!',
        customer: { full_name: 'Nguyễn Thu Hà' },
        created_at: '2026-03-12T10:00:00Z',
      },
      {
        id: 'r-2',
        rating: 5,
        comment:
          'Đi 4 người ở căn 2PN rộng rãi. Bếp full đồ, có thể tự nấu. Ngay gần bãi biển, đi bộ 3p ra cáp treo. Sạch sẽ, đáng giá tiền.',
        customer: { full_name: 'Trần Minh Quân' },
        created_at: '2026-02-28T14:20:00Z',
        owner_reply: 'Cảm ơn anh Quân đã ủng hộ. Hẹn gặp lại gia đình anh ở Hạ Long lần sau!',
      },
      {
        id: 'r-3',
        rating: 4,
        comment: 'Căn hộ ổn, view đẹp. Tuy nhiên buổi tối hơi ồn từ phố đi bộ phía dưới. Phòng tầng cao hơn sẽ tốt hơn.',
        customer: { full_name: 'Lê Anh Tuấn' },
        created_at: '2026-02-15T09:30:00Z',
      },
      {
        id: 'r-4',
        rating: 5,
        comment: 'Trải nghiệm 5 sao thực sự. Gym + spa + hồ bơi đều xịn. Check-in 24/7. Nên book sớm vì cuối tuần luôn full.',
        customer: { full_name: 'Phạm Thúy Linh' },
        created_at: '2026-02-02T18:45:00Z',
      },
    ],
    host: {
      full_name: 'Anh Tuấn',
      member_since: '2024-08',
      properties_count: 3,
      response_rate: 98,
      response_time: 'trong vòng 1 giờ',
    },
    rating: 4.92,
    reviewCount: 128,
    isGuestFavorite: true,
    lat: 20.9573,
    lng: 107.0756,
  },
};

/** Tổng hợp 1 detail "đầy đủ" từ data card. Dùng cho 7 sample property
 *  còn lại không có detail riêng — để mọi card click vào đều có trang chi tiết. */
function buildSampleDetailFromCard(card: PropertyCardData): SamplePropertyDetail {
  const images = (card.images && card.images.length > 0
    ? card.images
    : [card.cover_image_url ?? 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1600&q=85']
  ).map((u) => u.replace(/w=1200&q=80$/, 'w=1600&q=85'));

  return {
    id: card.id,
    name: card.name,
    slug: card.slug,
    city: card.city ?? 'Hạ Long',
    district: card.district ?? 'Bãi Cháy',
    address: `${card.district ?? 'Hạ Long'}, ${card.city ?? 'Hạ Long'}`,
    description: `${card.name} là cơ sở lưu trú chất lượng tại ${card.district ?? 'Hạ Long'}. ${
      card.locationText ?? ''
    } Cách trung tâm Bãi Cháy 5-15 phút di chuyển, gần các điểm tham quan nổi tiếng của Hạ Long.`,
    amenities: card.amenities,
    check_in_time: '14:00',
    check_out_time: '12:00',
    cancel_policy:
      'Hủy miễn phí trong 48h sau khi đặt. Hoàn 50% nếu hủy trước 7 ngày, không hoàn nếu hủy muộn hơn.',
    house_rules:
      'Không hút thuốc trong phòng. Không tổ chức tiệc/sự kiện. Vật nuôi không được phép.',
    booking_mode: card.booking_mode,
    cover_image_url: card.cover_image_url ?? images[0],
    images,
    reviews: [
      {
        id: `${card.id}-rv-1`,
        rating: 5,
        comment: 'Phòng sạch sẽ, vị trí thuận tiện. Chủ nhà nhiệt tình, check-in nhanh.',
        customer: { full_name: 'Nguyễn Hoàng Anh' },
        created_at: '2026-03-15T10:00:00Z',
      },
      {
        id: `${card.id}-rv-2`,
        rating: Math.min(5, Math.round((card.rating ?? 4.7) * 10) / 10),
        comment:
          'Đáng giá tiền. Sẽ quay lại lần sau khi có dịp ghé Hạ Long. Cảm ơn chủ nhà!',
        customer: { full_name: 'Trần Thị Mai' },
        created_at: '2026-02-20T14:30:00Z',
        owner_reply: 'Cảm ơn chị đã ủng hộ, hẹn gặp lại!',
      },
    ],
    host: {
      full_name: 'Chủ nhà',
      member_since: '2024-06',
      properties_count: 1,
      response_rate: 95,
      response_time: 'trong vòng vài giờ',
    },
    rating: card.rating ?? 4.7,
    reviewCount: card.reviewCount ?? 32,
    isGuestFavorite: card.isGuestFavorite,
    lat: 20.95 + (card.id.charCodeAt(card.id.length - 1) % 10) * 0.005,
    lng: 107.07 + (card.id.charCodeAt(card.id.length - 1) % 10) * 0.005,
  };
}

/** Tra detail theo slug — fallback dùng card builder cho 7 slug còn lại. */
export function getSamplePropertyDetail(slug: string): SamplePropertyDetail | null {
  const explicit = SAMPLE_PROPERTY_DETAILS[slug];
  if (explicit) return explicit;
  const card = SAMPLE_PROPERTIES.find((p) => p.slug === slug);
  if (card) return buildSampleDetailFromCard(card);
  return null;
}
