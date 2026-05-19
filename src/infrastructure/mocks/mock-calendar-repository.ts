import 'server-only';

import {
  CalendarStatus,
  type CalendarDay,
  type CalendarEvent,
  type CalendarFilters,
  type CalendarGrid,
  type CalendarGridFilters,
  type CalendarGridProperty,
  type LockDateInput,
  type MarkSoldInput,
  type UnlockDateInput,
} from '@/core/entities/calendar';
import type { CalendarRepository } from '@/application/ports/calendar-repository';

interface SeedProperty {
  id: string;
  name: string;
}

const SEED_PROPERTIES: SeedProperty[] = [
  { id: 'mock-prop-001', name: 'Villa B1716 — View biển Bãi Cháy' },
  { id: 'mock-prop-002', name: 'Homestay Hòn Gai Sky' },
  { id: 'mock-prop-003', name: 'Penthouse 28 — Marina' },
];

interface OverrideKey {
  propertyId: string;
  date: string;
}

/**
 * In-memory override store cho lock/sold trong dev/mock.
 * Reset khi server restart.
 */
const overrides = new Map<string, CalendarStatus>();

function overrideKey(k: OverrideKey): string {
  return `${k.propertyId}::${k.date}`;
}

function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * Sinh trạng thái demo deterministic theo (propertyId, date) — để mỗi reload không nhảy lung tung.
 * Cuối tuần dễ BOOKED, vài ngày HOLD, còn lại AVAILABLE.
 */
function seedStatus(propertyId: string, date: string): {
  status: CalendarStatus;
  note: string | null;
} {
  const d = new Date(date);
  const dow = d.getUTCDay();
  const dayOfMonth = d.getUTCDate();
  const hash = (propertyId.charCodeAt(0) + dayOfMonth) % 11;

  if ((dow === 5 || dow === 6) && hash > 4) {
    return {
      status: CalendarStatus.BOOKED,
      note:
        ['Nguyễn Văn An', 'Trần Thị B', 'Phạm Hữu Cường'][hash % 3] ?? null,
    };
  }
  if (hash === 3) {
    return { status: CalendarStatus.HOLD, note: 'Đang giữ chỗ' };
  }
  return { status: CalendarStatus.AVAILABLE, note: null };
}

export class MockCalendarRepository implements CalendarRepository {
  async getGrid(filters: CalendarGridFilters): Promise<CalendarGrid> {
    const dates = dateRange(filters.from, filters.to);

    const propertyIds = filters.propertyIds?.length
      ? SEED_PROPERTIES.filter((p) => filters.propertyIds!.includes(p.id))
      : SEED_PROPERTIES;

    const properties: CalendarGridProperty[] = propertyIds.map((prop) => ({
      id: prop.id,
      name: prop.name,
      days: dates.map<CalendarDay>((date) => {
        const ovr = overrides.get(overrideKey({ propertyId: prop.id, date }));
        if (ovr !== undefined) {
          return {
            date,
            status: ovr,
            note: ovr === CalendarStatus.LOCKED ? 'Khóa thủ công' : null,
          };
        }
        const seed = seedStatus(prop.id, date);
        return { date, status: seed.status, note: seed.note };
      }),
    }));

    return { from: filters.from, to: filters.to, properties };
  }

  async lockDate(input: LockDateInput): Promise<void> {
    overrides.set(overrideKey(input), CalendarStatus.LOCKED);
  }

  async unlockDate(input: UnlockDateInput): Promise<void> {
    overrides.delete(overrideKey(input));
  }

  async markSold(input: MarkSoldInput): Promise<void> {
    overrides.set(overrideKey(input), CalendarStatus.BOOKED);
  }

  async list(_filters?: CalendarFilters): Promise<CalendarEvent[]> {
    // legacy event-based — endpoint không tồn tại, trả rỗng cho safe.
    return [];
  }
}
