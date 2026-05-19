export type VND = number & { readonly __brand: 'VND' };

const VN_MONEY = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function vnd(n: number): VND {
  if (!Number.isFinite(n)) {
    throw new Error(`vnd: invalid number ${n}`);
  }
  return Math.round(n) as VND;
}

/**
 * Format VND amount. Quy ước UI Halong24h:
 *  - null/undefined → "—" (em dash, không có dữ liệu)
 *  - khác (kể cả 0) → "{n} ₫"
 *
 * (Đồng bộ với `formatVND` trong `@/lib/format`.)
 */
export function formatVND(n: VND | number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return VN_MONEY.format(n);
}

export function vndOrZero(n: number | null | undefined): VND {
  return vnd(n ?? 0);
}
