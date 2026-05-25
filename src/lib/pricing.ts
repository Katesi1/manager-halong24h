import type { PricingRule, Room } from './legacy-types';

/**
 * Pricing engine — rules-based với priority + override stops chain.
 *
 * Algorithm:
 * 1. Bắt đầu với base_price
 * 2. Lấy tất cả rule áp dụng cho ngày này (sort priority desc)
 * 3. Apply từng rule: percent +20 → ×1.2; flat +500000 → +500k
 * 4. Override type → áp xong là DỪNG (không stack rule khác)
 * 5. Weekend + seasonal có thể stack (cộng dồn % hoặc flat)
 *
 * Ví dụ:
 *   base = 1.000.000
 *   weekend rule: percent +20 (priority 1)
 *   seasonal rule: percent +50 (priority 2)
 *   T7 mùa lễ → 1.000.000 × 1.5 (seasonal) × 1.2 (weekend) = 1.800.000
 *
 *   Override Tết: flat 3.000.000 (priority 100)
 *   Tết → 3.000.000 (override dừng chain, kệ weekend/seasonal)
 */

export interface PriceForDateResult {
  price: number;
  appliedRules: { type: string; label: string | null; priority: number }[];
}

function isPostgresDow(date: Date): number {
  return date.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
}

function ruleApplies(rule: PricingRule, dateISO: string, dow: number): boolean {
  // Date range check
  if (rule.start_date && dateISO < rule.start_date) return false;
  if (rule.end_date && dateISO > rule.end_date) return false;
  // Weekday check (if rule restricts weekdays)
  if (rule.weekdays && rule.weekdays.length > 0 && !rule.weekdays.includes(dow)) return false;
  return true;
}

function applyAdjustment(currentPrice: number, rule: PricingRule): number {
  const value = Number(rule.adjustment_value);
  if (rule.adjustment_type === 'percent') {
    return Math.round(currentPrice * (1 + value / 100));
  }
  // flat: nếu value là số dương thì cộng vào, nếu rule type='override' thì coi như giá tuyệt đối
  if (rule.type === 'override' && value > 0) {
    return Math.round(value); // override flat = absolute price
  }
  return Math.round(currentPrice + value);
}

/** Tính giá cho 1 ngày của 1 phòng, có rules engine.
 *  Backward compat: nếu chỉ có base_price + weekend_price (không có rules), fallback sang logic cũ. */
export function priceForDate(
  room: Pick<Room, 'base_price' | 'weekend_price'>,
  date: Date | string,
  rules: PricingRule[] = [],
): PriceForDateResult {
  const d = typeof date === 'string' ? new Date(date) : date;
  const iso = d.toISOString().slice(0, 10);
  const dow = isPostgresDow(d);

  let price = Number(room.base_price);
  const applied: PriceForDateResult['appliedRules'] = [];

  // Backward compat: weekend_price applied first if no weekend rule
  const hasWeekendRule = rules.some((r) => r.type === 'weekend');
  if (!hasWeekendRule && (dow === 0 || dow === 5 || dow === 6) && room.weekend_price != null) {
    price = Number(room.weekend_price);
    applied.push({ type: 'weekend (legacy)', label: null, priority: 0 });
  }

  // Sort rules by priority DESC (highest first)
  const sorted = [...rules]
    .filter((r) => ruleApplies(r, iso, dow))
    .sort((a, b) => b.priority - a.priority);

  for (const rule of sorted) {
    price = applyAdjustment(price, rule);
    applied.push({ type: rule.type, label: rule.label, priority: rule.priority });
    if (rule.type === 'override') break; // override stops chain
  }

  return { price: Math.max(0, price), appliedRules: applied };
}

/** Tổng giá cho khoảng [check_in, check_out) */
export function totalPrice(
  room: Pick<Room, 'base_price' | 'weekend_price'>,
  checkIn: string,
  checkOut: string,
  rules: PricingRule[] = [],
): number {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  let total = 0;
  const cur = new Date(start);
  while (cur < end) {
    total += priceForDate(room, cur, rules).price;
    cur.setDate(cur.getDate() + 1);
  }
  return total;
}

/** Số đêm */
export function nightCount(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Sinh dải giá theo ngày (preview 30 ngày) */
export function pricePreview(
  room: Pick<Room, 'base_price' | 'weekend_price'>,
  startDate: string,
  days: number,
  rules: PricingRule[] = [],
): {
  date: string;
  price: number;
  isOverride: boolean;
  isWeekend: boolean;
  isSeasonal: boolean;
  appliedLabels: string[];
}[] {
  const result: ReturnType<typeof pricePreview> = [];
  const cur = new Date(startDate);
  for (let i = 0; i < days; i++) {
    const r = priceForDate(room, cur, rules);
    const dow = cur.getDay();
    result.push({
      date: cur.toISOString().slice(0, 10),
      price: r.price,
      isOverride: r.appliedRules.some((ar) => ar.type === 'override'),
      isWeekend: dow === 0 || dow === 5 || dow === 6,
      isSeasonal: r.appliedRules.some((ar) => ar.type === 'seasonal'),
      appliedLabels: r.appliedRules.map((ar) => ar.label).filter((l): l is string => !!l),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
