'use server';

import { revalidatePath } from 'next/cache';

import { getCalendarGridUseCase } from '@/application/calendar/grid';
import { listCalendarEventsUseCase } from '@/application/calendar/list';
import {
  lockDateUseCase,
  markSoldUseCase,
  unlockDateUseCase,
} from '@/application/calendar/lock';
import type { CalendarFilters } from '@/core/entities/calendar';
import { calendarRepository } from '@/infrastructure/container';
import { requireManagerRole, requireOwnerOfProperty } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/**
 * Calendar — hiện tại MOCK. Khi BE ra endpoint, đổi `calendarRepository()` trong container.ts.
 */
export async function getCalendarGridAction(input: {
  from: string;
  to: string;
  propertyIds?: string[];
}) {
  return toResult(async () => {
    await requireManagerRole();
    return getCalendarGridUseCase(calendarRepository(), input);
  });
}

export async function lockDateAction(input: {
  propertyId: string;
  date: string;
}) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(input.propertyId);
    return lockDateUseCase(calendarRepository(), input);
  });
  if (result.ok) revalidatePath('/host/calendar');
  return result;
}

export async function unlockDateAction(input: {
  propertyId: string;
  date: string;
}) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(input.propertyId);
    return unlockDateUseCase(calendarRepository(), input);
  });
  if (result.ok) revalidatePath('/host/calendar');
  return result;
}

export async function markSoldAction(input: {
  propertyId: string;
  date: string;
}) {
  const result = await toResult(async () => {
    await requireOwnerOfProperty(input.propertyId);
    return markSoldUseCase(calendarRepository(), input);
  });
  if (result.ok) revalidatePath('/host/calendar');
  return result;
}

/** @deprecated dùng getCalendarGridAction. */
export async function listCalendarEventsAction(filters?: CalendarFilters) {
  return toResult(async () => {
    await requireManagerRole();
    return listCalendarEventsUseCase(calendarRepository(), filters);
  });
}
