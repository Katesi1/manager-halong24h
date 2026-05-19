import 'server-only';

import type {
  Booking,
  BookingFilters,
  CancelBookingInput,
  CreateBookingHoldInput,
} from '@/core/entities/booking';
import type { BookingRepository } from '@/application/ports/booking-repository';

import { apiClient } from '../http/api-client';

export class ApiBookingRepository implements BookingRepository {
  async list(filters?: BookingFilters): Promise<Booking[]> {
    return apiClient.get<Booking[]>('/bookings', {
      query: {
        status: filters?.status,
        propertyId: filters?.propertyId,
        from: filters?.from,
        to: filters?.to,
      },
      cache: 'no-store',
    });
  }

  async getById(id: string): Promise<Booking | null> {
    try {
      return await apiClient.get<Booking>(`/bookings/${id}`, {
        cache: 'no-store',
      });
    } catch (err) {
      if (
        err instanceof Error &&
        'status' in err &&
        (err as { status: number }).status === 404
      ) {
        return null;
      }
      throw err;
    }
  }

  async hold(input: CreateBookingHoldInput): Promise<Booking> {
    return apiClient.post<Booking>('/bookings/hold', input);
  }

  async confirm(id: string): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${id}/confirm`);
  }

  async markPaid(id: string, amount?: number): Promise<Booking> {
    return apiClient.patch<Booking>(
      `/bookings/${id}/mark-paid`,
      amount !== undefined ? { amount } : undefined,
    );
  }

  async cancel(input: CancelBookingInput): Promise<Booking> {
    return apiClient.patch<Booking>(`/bookings/${input.id}/cancel`, {
      reason: input.reason,
    });
  }
}
