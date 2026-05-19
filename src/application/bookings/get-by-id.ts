import type { Booking } from '@/core/entities/booking';
import type { BookingRepository } from '../ports/booking-repository';

export async function getBookingByIdUseCase(
  repo: BookingRepository,
  id: string,
): Promise<Booking | null> {
  if (!id) return null;
  return repo.getById(id);
}
