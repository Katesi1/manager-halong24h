import type { Booking, BookingFilters } from '@/core/entities/booking';
import type { BookingRepository } from '../ports/booking-repository';

export async function listBookingsUseCase(
  repo: BookingRepository,
  filters?: BookingFilters,
): Promise<Booking[]> {
  return repo.list(filters);
}
