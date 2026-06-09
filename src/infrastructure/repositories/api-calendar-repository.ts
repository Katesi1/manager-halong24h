import 'server-only';

import {
  CalendarStatus,
  type CalendarDay,
  type CalendarEvent,
  type CalendarFilters,
  type CalendarGrid,
  type CalendarGridFilters,
  type LockDateInput,
  type MarkSoldInput,
  type UnlockDateInput,
} from '@/core/entities/calendar';
import type { CalendarRepository } from '@/application/ports/calendar-repository';

import { apiClient } from '../http/api-client';

interface SpecGridDay {
  date: string;
  status: 'available' | 'hold' | 'booked' | 'locked';
  note: string | null;
  bookingId: string | null;
}

interface SpecGridProperty {
  id: string;
  name: string;
  type?: number;
  days: SpecGridDay[];
}

interface SpecGridResponse {
  properties: SpecGridProperty[];
}

function mapStatus(s: SpecGridDay['status']): CalendarStatus {
  switch (s) {
    case 'available':
      return CalendarStatus.AVAILABLE;
    case 'hold':
      return CalendarStatus.HOLD;
    case 'booked':
      return CalendarStatus.BOOKED;
    case 'locked':
      return CalendarStatus.LOCKED;
  }
}

function mapDay(d: SpecGridDay): CalendarDay {
  return {
    date: d.date,
    status: mapStatus(d.status),
    note: d.note,
    bookingId: d.bookingId,
  };
}

export class ApiCalendarRepository implements CalendarRepository {
  async getGrid(filters: CalendarGridFilters): Promise<CalendarGrid> {
    // Spec v1.3 §6 B2 — `?propertyIds=uuid1,uuid2` CSV cho multi-property.
    const propertyIds = filters.propertyIds?.join(',');
    const data = await apiClient.get<SpecGridResponse>('/calendar/grid', {
      query: {
        startDate: filters.from,
        endDate: filters.to,
        propertyIds,
      },
      cache: 'no-store',
    });
    return {
      from: filters.from,
      to: filters.to,
      properties: data.properties.map((p) => ({
        id: p.id,
        name: p.name,
        days: p.days.map(mapDay),
      })),
    };
  }

  async lockDate(input: LockDateInput): Promise<void> {
    await apiClient.post('/calendar/lock', {
      propertyId: input.propertyId,
      date: input.date,
    });
  }

  async unlockDate(input: UnlockDateInput): Promise<void> {
    await apiClient.delete('/calendar/lock', {
      body: { propertyId: input.propertyId, date: input.date },
    });
  }

  async markSold(input: MarkSoldInput): Promise<void> {
    await apiClient.patch('/calendar/sold', {
      propertyId: input.propertyId,
      date: input.date,
    });
  }

  async list(_filters?: CalendarFilters): Promise<CalendarEvent[]> {
    // Spec không có endpoint event-based. Trả mảng rỗng để UI legacy không vỡ.
    return [];
  }
}
