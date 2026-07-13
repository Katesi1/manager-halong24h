import type { CancellationPolicy } from '../value-objects/property-type';
import type { VND } from '../value-objects/vnd';

/**
 * Du thuyền (Yacht) — spec B1 (WEB QUẢN LÝ, ADMIN + SALE hệ thống).
 *
 * Cấu trúc gần với Property nhưng đặc thù du thuyền: cabin, chiều dài thân
 * (lengthMeters), loại tàu (shipType), điểm khởi hành, thời lượng hành trình
 * (durationText) + hành trình theo chặng (itinerary).
 *
 * `slug` do BE tự sinh — FE không nhập. `code` unique, KHÔNG đổi sau khi tạo.
 * Giá tính giống homestay: ngày thường / cuối tuần (T6–CN) / lễ + phụ thu
 * người lớn/trẻ vượt chuẩn.
 */
export interface YachtImage {
  id: string;
  imageUrl: string;
  isCover: boolean;
  order: number;
}

/** 1 chặng trong hành trình du thuyền. */
export interface YachtItineraryStep {
  order: number;
  title: string;
  time?: string | null;
  description?: string | null;
}

export interface Yacht {
  id: string;
  name: string;
  /** Mã unique — KHÔNG đổi được sau khi tạo. */
  code: string;
  /** BE tự sinh từ name — FE chỉ đọc. */
  slug: string | null;
  description: string | null;
  cabins: number | null;
  maxGuests: number | null;
  lengthMeters: number | null;
  shipType: string | null;
  departurePoint: string | null;
  durationText: string | null;
  itinerary: YachtItineraryStep[];
  amenities: string[];
  services: string[];
  rules: string | null;
  cancellationPolicy: CancellationPolicy | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  /** Giá NGƯỜI LỚN / khách theo ngày (spec §27.2, bán theo đầu người). */
  weekdayPrice: VND | null;
  weekendPrice: VND | null;
  holidayPrice: VND | null;
  /** Giá TRẺ EM / khách theo ngày. `null` = trẻ em miễn phí. */
  weekdayChildPrice: VND | null;
  weekendChildPrice: VND | null;
  holidayChildPrice: VND | null;
  isActive: boolean;
  images: YachtImage[];
  bookingCount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface YachtFilters {
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateYachtInput {
  name: string;
  code: string;
  description?: string;
  cabins?: number;
  maxGuests?: number;
  lengthMeters?: number;
  shipType?: string;
  departurePoint?: string;
  durationText?: string;
  itinerary?: YachtItineraryStep[];
  amenities?: string[];
  services?: string[];
  rules?: string;
  cancellationPolicy?: CancellationPolicy;
  checkInTime?: string;
  checkOutTime?: string;
  /** Giá người lớn/khách theo ngày (optional khi tạo). */
  weekdayPrice?: number;
  weekendPrice?: number;
  holidayPrice?: number;
  /** Giá trẻ em/khách theo ngày (optional — bỏ trống = miễn phí). */
  weekdayChildPrice?: number;
  weekendChildPrice?: number;
  holidayChildPrice?: number;
}

/** Sửa cơ sở (partial) — `code` bỏ qua ở BE (không đổi được). Kèm isActive bật/tắt. */
export type UpdateYachtInput = Partial<CreateYachtInput> & {
  isActive?: boolean;
};

/**
 * PUT /yachts/:id/prices (spec §27.2) — 3 giá người lớn BẮT BUỘC; 3 giá trẻ em
 * TUỲ CHỌN (bỏ trống = trẻ em miễn phí). Đơn vị VND/khách.
 */
export interface UpdateYachtPricesInput {
  weekdayPrice: number;
  weekendPrice: number;
  holidayPrice: number;
  weekdayChildPrice?: number;
  weekendChildPrice?: number;
  holidayChildPrice?: number;
}
