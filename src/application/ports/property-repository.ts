import type {
  CreatePropertyInput,
  Property,
  PropertyFilters,
  PropertyImage,
  UpdatePricesInput,
  UpdatePropertyInput,
} from '@/core/entities/property';

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
}
