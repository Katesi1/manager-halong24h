import type {
  CreateYachtInput,
  UpdateYachtInput,
  UpdateYachtPricesInput,
  Yacht,
  YachtFilters,
  YachtImage,
} from '@/core/entities/yacht';

export interface YachtRepository {
  list(filters?: YachtFilters): Promise<Yacht[]>;
  getById(id: string): Promise<Yacht | null>;
  create(input: CreateYachtInput): Promise<Yacht>;
  update(id: string, input: UpdateYachtInput): Promise<Yacht>;
  delete(id: string): Promise<void>;
  updatePrices(id: string, input: UpdateYachtPricesInput): Promise<Yacht>;
  uploadImages(id: string, files: File[]): Promise<YachtImage[]>;
  deleteImage(yachtId: string, imageId: string): Promise<void>;
  setCoverImage(yachtId: string, imageId: string): Promise<void>;
}
