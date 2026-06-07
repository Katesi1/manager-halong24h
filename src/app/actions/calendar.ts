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

/**
 * Bulk lock/unlock — chạy tuần tự qua use-case đơn lẻ.
 * BE chưa có endpoint bulk; khi có sẽ swap qua 1 API call.
 */
export async function bulkLockDatesAction(input: {
  items: { propertyId: string; date: string }[];
  mode: 'lock' | 'unlock';
}) {
  const result = await toResult(async () => {
    const seenProps = new Set<string>();
    for (const it of input.items) {
      if (!seenProps.has(it.propertyId)) {
        await requireOwnerOfProperty(it.propertyId);
        seenProps.add(it.propertyId);
      }
    }
    const repo = calendarRepository();
    if (input.mode === 'lock') {
      for (const it of input.items) await lockDateUseCase(repo, it);
    } else {
      for (const it of input.items) await unlockDateUseCase(repo, it);
    }
    return { count: input.items.length };
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
