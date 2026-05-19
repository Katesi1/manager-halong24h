import { ValidationError } from '@/core/errors';
import type { PropertyImage } from '@/core/entities/property';
import type { PropertyRepository } from '../ports/property-repository';

const MAX_FILES_PER_UPLOAD = 20;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadPropertyImagesUseCase(
  repo: PropertyRepository,
  propertyId: string,
  files: File[],
): Promise<PropertyImage[]> {
  if (files.length === 0) {
    throw new ValidationError('Vui lòng chọn ít nhất 1 ảnh');
  }
  if (files.length > MAX_FILES_PER_UPLOAD) {
    throw new ValidationError(
      `Tối đa ${MAX_FILES_PER_UPLOAD} ảnh mỗi lần upload`,
    );
  }
  for (const f of files) {
    if (!ACCEPTED_TYPES.has(f.type)) {
      throw new ValidationError(
        `Định dạng ${f.type} không hỗ trợ — chỉ JPG/PNG/WEBP`,
      );
    }
    if (f.size > MAX_FILE_SIZE_BYTES) {
      throw new ValidationError(`Ảnh "${f.name}" vượt quá 10 MB`);
    }
  }
  return repo.uploadImages(propertyId, files);
}

export async function deletePropertyImageUseCase(
  repo: PropertyRepository,
  propertyId: string,
  imageId: string,
): Promise<void> {
  await repo.deleteImage(propertyId, imageId);
}

export async function setPropertyCoverImageUseCase(
  repo: PropertyRepository,
  propertyId: string,
  imageId: string,
): Promise<void> {
  await repo.setCoverImage(propertyId, imageId);
}
