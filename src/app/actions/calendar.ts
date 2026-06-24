'use server';

import { revalidatePath } from 'next/cache';

import { getCalendarGridUseCase } from '@/application/calendar/grid';
import { listCalendarEventsUseCase } from '@/application/calendar/list';
import {
  lockDateUseCase,
  markSoldUseCase,
  unlockDateUseCase,
} from '@/application/calendar/lock';
import {
  CALENDAR_BULK_MAX_ITEMS,
  type CalendarFilters,
} from '@/core/entities/calendar';
import { calendarRepository } from '@/infrastructure/container';
import { requireManagerRole, requireOwnerOfProperty } from '@/lib/auth-guard';

import { toResult } from './_helpers';

/** Calendar Server Actions — `ApiCalendarRepository` (spec §6 + §25.6). */
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
 * Bulk lock/unlock — 1 request `POST /calendar/bulk` (spec §25.6, max 100 items).
 */
export async function bulkLockDatesAction(input: {
  items: { propertyId: string; date: string }[];
  mode: 'lock' | 'unlock';
}) {
  const result = await toResult(async () => {
    await requireManagerRole();
    if (input.items.length === 0) {
      throw new Error('Chưa chọn ngày nào.');
    }
    if (input.items.length > CALENDAR_BULK_MAX_ITEMS) {
      throw new Error(
        `Tối đa ${CALENDAR_BULK_MAX_ITEMS} ngày mỗi lần. Vui lòng chia nhỏ.`,
      );
    }
    // Mỗi property xuất hiện trong items đều phải thuộc quyền của owner.
    const seenProps = new Set<string>();
    for (const it of input.items) {
      if (!seenProps.has(it.propertyId)) {
        await requireOwnerOfProperty(it.propertyId);
        seenProps.add(it.propertyId);
      }
    }
    await calendarRepository().bulkLock({ mode: input.mode, items: input.items });
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
