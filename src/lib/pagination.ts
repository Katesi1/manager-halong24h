/**
 * Tiện ích phân trang dùng chung cho các trang Server Component.
 * URL giữ state qua query `?page=`; slice client-side trên tập đã lọc.
 */

/** Parse `?page=` → số trang hợp lệ (>= 1). */
export function parsePage(raw: string | undefined): number {
  const n = parseInt(raw ?? '1', 10);
  return Number.isFinite(n) && n > 1 ? n : 1;
}

/** Tổng số trang (tối thiểu 1 để tránh chia 0). */
export function pageCount(totalItems: number, pageSize: number): number {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

/** Cắt mảng theo trang hiện tại. */
export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Dựng href giữ nguyên các param hiện có, bỏ param rỗng/undefined. */
export function buildPageHref(
  base: string,
  params: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `${base}?${qs}` : base;
}
