import type {
  CalendarEvent,
  CalendarFilters,
} from '@/core/entities/calendar';
import type { CalendarRepository } from '../ports/calendar-repository';

export async function listCalendarEventsUseCase(
  repo: CalendarRepository,
  filters?: CalendarFilters,
): Promise<CalendarEvent[]> {
  return repo.list(filters);
}
