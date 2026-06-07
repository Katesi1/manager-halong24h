import 'server-only';

import type {
  CreatePropertyInput,
  Property,
  PropertyFilters,
  PropertyImage,
  UpdatePricesInput,
  UpdatePropertyInput,
} from '@/core/entities/property';
import type { PropertyRepository } from '@/application/ports/property-repository';
import {
  CancellationPolicy,
  PropertyType,
} from '@/core/value-objects/property-type';
import { vnd } from '@/core/value-objects/vnd';

const OWNER_ID = 'owner-001';

const MOCK_PROPERTIES: Property[] = [
  {
    id: 'mock-prop-001',
    name: 'Villa B1716 — View biển Bãi Cháy',
    type: PropertyType.VILLA,
    code: 'VLB1716',
    view: 'sea',
    address: 'Bãi Cháy, Hạ Long, Quảng Ninh',
    mapLink: null,
    isActive: true,
    bedrooms: 4,
    bathrooms: 3,
    standardGuests: 8,
    maxGuests: 10,
    weekdayPrice: vnd(3_500_000),
    weekendPrice: vnd(4_500_000),
    holidayPrice: vnd(5_500_000),
    adultSurcharge: vnd(300_000),
    childSurcharge: vnd(150_000),
    amenities: ['wifi', 'pool', 'bbq', 'kitchen'],
    cancellationPolicy: CancellationPolicy.MODERATE,
    rules: 'Không hút thuốc trong phòng. Check-in từ 14h, check-out trước 12h.',
    services: ['cleaning', 'breakfast'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    childrenPolicy: 'allowed',
    petPolicy: 'with_fee',
    smokingPolicy: 'outdoor_only',
    partyPolicy: 'not_allowed',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    description:
      'Villa 4 phòng ngủ view trực tiếp Vịnh Hạ Long. Phù hợp gia đình hoặc nhóm bạn.',
    ownerId: OWNER_ID,
    images: [],
    bookingCount: 12,
  },
  {
    id: 'mock-prop-002',
    name: 'Homestay Hòn Gai Sky',
    type: PropertyType.HOMESTAY,
    code: 'HSHG02',
    view: 'city',
    address: 'Hòn Gai, Hạ Long, Quảng Ninh',
    mapLink: null,
    isActive: true,
    bedrooms: 2,
    bathrooms: 1,
    standardGuests: 4,
    maxGuests: 5,
    weekdayPrice: vnd(900_000),
    weekendPrice: vnd(1_200_000),
    holidayPrice: vnd(1_500_000),
    adultSurcharge: vnd(150_000),
    childSurcharge: vnd(80_000),
    amenities: ['wifi', 'kitchen', 'washer'],
    cancellationPolicy: CancellationPolicy.FLEXIBLE,
    rules: 'Giữ vệ sinh chung. Không tổ chức tiệc gây ồn sau 22h.',
    services: ['cleaning'],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    childrenPolicy: 'allowed',
    petPolicy: 'not_allowed',
    smokingPolicy: 'outdoor_only',
    partyPolicy: 'small_only',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    description: 'Homestay nhỏ ấm cúng, view thành phố Hòn Gai.',
    ownerId: OWNER_ID,
    images: [],
    bookingCount: 7,
  },
  {
    id: 'mock-prop-003',
    name: 'Penthouse 28 — Marina',
    type: PropertyType.HOTEL,
    code: 'PH28MA',
    view: 'sea',
    address: 'Marina, Hạ Long, Quảng Ninh',
    mapLink: null,
    isActive: false,
    bedrooms: 3,
    bathrooms: 2,
    standardGuests: 6,
    maxGuests: 7,
    weekdayPrice: vnd(4_200_000),
    weekendPrice: vnd(5_500_000),
    holidayPrice: vnd(7_000_000),
    adultSurcharge: vnd(400_000),
    childSurcharge: vnd(200_000),
    amenities: ['wifi', 'gym', 'parking'],
    cancellationPolicy: CancellationPolicy.STRICT,
    rules: 'Không vật nuôi. Không hút thuốc trong toàn bộ căn hộ.',
    services: ['concierge', 'cleaning'],
    checkInTime: '15:00',
    checkOutTime: '12:00',
    childrenPolicy: 'with_conditions',
    petPolicy: 'not_allowed',
    smokingPolicy: 'not_allowed',
    partyPolicy: 'not_allowed',
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    description: 'Penthouse cao cấp khu Marina, view 270° vịnh.',
    ownerId: OWNER_ID,
    images: [],
    bookingCount: 0,
  },
];

export class MockPropertyRepository implements PropertyRepository {
  async list(filters?: PropertyFilters): Promise<Property[]> {
    let out = [...MOCK_PROPERTIES];
    if (!filters?.includeInactive) {
      out = out.filter((p) => p.isActive);
    }
    if (filters?.view) {
      out = out.filter((p) => p.view === filters.view);
    }
    return out;
  }

  async getById(id: string): Promise<Property | null> {
    return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
  }

  async create(_input: CreatePropertyInput): Promise<Property> {
    throw new Error('Mock property repository: create chưa hỗ trợ.');
  }

  async update(id: string, _input: UpdatePropertyInput): Promise<Property> {
    const found = await this.getById(id);
    if (!found) throw new Error(`Mock property repository: không tìm thấy ${id}`);
    return found;
  }

  async delete(_id: string): Promise<void> {
    // no-op in mock
  }

  async updatePrices(id: string, _input: UpdatePricesInput) {
    const found = await this.getById(id);
    if (!found) throw new Error(`Mock property repository: không tìm thấy ${id}`);
    return {
      id: found.id,
      name: found.name,
      code: found.code,
      weekdayPrice: found.weekdayPrice,
      weekendPrice: found.weekendPrice,
      holidayPrice: found.holidayPrice,
      adultSurcharge: found.adultSurcharge,
      childSurcharge: found.childSurcharge,
    };
  }

  async uploadImages(_id: string, _files: File[]): Promise<PropertyImage[]> {
    return [];
  }

  async deleteImage(_propertyId: string, _imageId: string): Promise<void> {
    // no-op
  }

  async setCoverImage(_propertyId: string, _imageId: string): Promise<void> {
    // no-op
  }

  async listPublic(): Promise<Property[]> {
    return MOCK_PROPERTIES.filter((p) => p.isActive);
  }

  async getShare(id: string): Promise<Property | null> {
    return MOCK_PROPERTIES.find((p) => p.id === id) ?? null;
  }

  async approve(id: string): Promise<Property> {
    const found = await this.getById(id);
    if (!found) throw new Error(`Mock property repository: không tìm thấy ${id}`);
    return found;
  }

  async reject(id: string, _reason: string): Promise<Property> {
    const found = await this.getById(id);
    if (!found) throw new Error(`Mock property repository: không tìm thấy ${id}`);
    return found;
  }

  async suspend(id: string, _reason?: string): Promise<Property> {
    const found = await this.getById(id);
    if (!found) throw new Error(`Mock property repository: không tìm thấy ${id}`);
    return found;
  }
}
