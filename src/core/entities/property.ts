import type {
  CancellationPolicy,
  PropertyType,
  PropertyView,
} from '../value-objects/property-type';
import type { VND } from '../value-objects/vnd';

/**
 * Trạng thái duyệt cơ sở (spec §4.5). Vòng đời:
 *  - pending   — chờ admin duyệt (mới tạo, BE chưa auto-approve)
 *  - approved  — được phép hoạt động; public khi isActive=true
 *  - rejected  — admin từ chối (kèm reason); OWNER sửa lại → BE auto approved
 *  - suspended — admin tạm ngưng cơ sở đang approved; OWNER không tự bật lại
 */
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

/** R16 — Quy định nội bộ có cấu trúc. */
export type ChildrenPolicy = 'allowed' | 'with_conditions' | 'not_allowed';
export type PetPolicy = 'allowed' | 'with_fee' | 'not_allowed';
export type SmokingPolicy = 'allowed' | 'outdoor_only' | 'not_allowed';
export type PartyPolicy = 'allowed' | 'small_only' | 'not_allowed';

export interface PropertyImage {
  id: string;
  imageUrl: string;
  isCover: boolean;
  order: number;
}

export interface PropertyOwnerSummary {
  id: string;
  name: string;
  phone: string | null;
}

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  code: string;
  view: PropertyView | null;
  address: string | null;
  mapLink: string | null;
  isActive: boolean;
  /** Trạng thái duyệt (spec §4.5). BE luôn trả về cùng property DTO. */
  moderationStatus: ModerationStatus;
  /** Lý do admin từ chối (chỉ có khi moderationStatus='rejected'). */
  moderationRejectedReason: string | null;
  /** Thời điểm admin duyệt/từ chối/tạm ngưng gần nhất. */
  moderationReviewedAt: string | null;
  /** Badge "Hot" do admin curated (spec §4.10). */
  isHot: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  standardGuests: number | null;
  maxGuests: number | null;
  weekdayPrice: VND | null;
  weekendPrice: VND | null;
  holidayPrice: VND | null;
  adultSurcharge: VND | null;
  childSurcharge: VND | null;
  amenities: string[];
  cancellationPolicy: CancellationPolicy | null;
  rules: string | null;
  services: string[];
  checkInTime: string | null;
  checkOutTime: string | null;
  childrenPolicy: ChildrenPolicy | null;
  petPolicy: PetPolicy | null;
  smokingPolicy: SmokingPolicy | null;
  partyPolicy: PartyPolicy | null;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  description: string | null;
  ownerId: string;
  owner?: PropertyOwnerSummary;
  images: PropertyImage[];
  bookingCount: number;
}

export interface PropertyFilters {
  includeInactive?: boolean;
  view?: PropertyView;
}

export interface CreatePropertyInput {
  name: string;
  type: PropertyType;
  code: string;
  view?: PropertyView;
  address?: string;
  mapLink?: string;
  bedrooms?: number;
  bathrooms?: number;
  standardGuests?: number;
  maxGuests?: number;
  amenities?: string[];
  description?: string;
  rules?: string;
  services?: string[];
  cancellationPolicy?: CancellationPolicy;
  weekdayPrice?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  adultSurcharge?: number;
  childSurcharge?: number;
  checkInTime?: string;
  checkOutTime?: string;
  childrenPolicy?: ChildrenPolicy;
  petPolicy?: PetPolicy;
  smokingPolicy?: SmokingPolicy;
  partyPolicy?: PartyPolicy;
  quietHoursStart?: string;
  quietHoursEnd?: string;
  ownerId?: string; // Admin only
}

export type UpdatePropertyInput = Partial<CreatePropertyInput> & {
  isActive?: boolean;
  latitude?: number;
  longitude?: number;
  checkInTime?: string;
  checkOutTime?: string;
};

export interface UpdatePricesInput {
  weekdayPrice?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  adultSurcharge?: number;
  childSurcharge?: number;
}
