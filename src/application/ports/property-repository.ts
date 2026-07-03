import type {
  CreatePropertyInput,
  Property,
  PropertyFilters,
  PropertyImage,
  UpdatePricesInput,
  UpdatePropertyInput,
} from '@/core/entities/property';

export interface PublicPropertyFilters {
  checkinDate?: string;
  checkoutDate?: string;
  guests?: number;
  minPrice?: number;
  maxPrice?: number;
  type?: number;
  view?: string;
}

export interface PropertyRepository {
  list(filters?: PropertyFilters): Promise<Property[]>;
  getById(id: string): Promise<Property | null>;
  create(input: CreatePropertyInput): Promise<Property>;
  update(id: string, input: UpdatePropertyInput): Promise<Property>;
  delete(id: string): Promise<void>;
  updatePrices(id: string, input: UpdatePricesInput): Promise<Pick<Property, 'id' | 'name' | 'code' | 'weekdayPrice' | 'weekendPrice' | 'holidayPrice' | 'adultSurcharge' | 'childSurcharge'>>;
  uploadImages(id: string, files: File[]): Promise<PropertyImage[]>;
  deleteImage(propertyId: string, imageId: string): Promise<void>;
  setCoverImage(propertyId: string, imageId: string): Promise<void>;

  /** Spec §4.1 — GET /properties/public (no auth). */
  listPublic(filters?: PublicPropertyFilters): Promise<Property[]>;
  /** Spec §4.1 — GET /properties/share/:id (no auth, no prices). */
  getShare(id: string): Promise<Property | null>;

  /** Spec §4.4 — moderation actions (admin only). */
  approve(id: string): Promise<Property>;
  reject(id: string, reason: string): Promise<Property>;
  suspend(id: string, reason?: string): Promise<Property>;
  /** Spec §4.10 — bật/tắt badge "Hot" (admin only). */
  setHot(id: string, isHot: boolean): Promise<Property>;
}
