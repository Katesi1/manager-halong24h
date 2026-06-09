const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

/**
 * Format VND số tiền: 1500000 -> "1.500.000 ₫".
 *
 * Quy ước UI Halong24h:
 *  - null/undefined → "—" (không có dữ liệu / API fail)
 *  - 0/khác → "{n} ₫" với đơn vị `₫` cong (NBSP cách số).
 *
 * Lưu ý: `0` được render là `0 ₫` chứ KHÔNG phải "Miễn phí" — vì 0 ₫ cũng
 * là số liệu hợp lệ (doanh thu 0 đồng vs API chưa trả lời). Pricing
 * tier label "Miễn phí" được hardcode trong UI tier table.
 */
export function formatVND(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return VND_FORMATTER.format(amount);
}

/** Alias rõ tên cho call-site mới — cùng output với `formatVND`. */
export const formatCurrency = formatVND;

/**
 * Tên hiển thị fallback: ưu tiên `name`, nếu trống dùng phần local của email
 * (`huynguyen.053219@gmail.com` → `Huynguyen.053219`). Nếu cả 2 cùng trống → "—".
 *
 * Dùng cho list view khi user chưa cập nhật profile (vd: vừa Google sign-in).
 */
export function displayName(
  name: string | null | undefined,
  email?: string | null,
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email?.split('@')[0]?.trim();
  if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  return '—';
}

/** Format VND ngắn: 1500000 -> "1.5tr" */
export function formatVNDShort(amount: number | null | undefined): string {
  if (amount == null) return '0';
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}tr`;
  }
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k`;
  return `${amount}`;
}

/** Format date: "2026-04-30" -> "30/04/2026" */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Format datetime: "2026-04-30T14:00:00Z" -> "14:00 30/04/2026" */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/** Số đêm giữa check_in và check_out (exclusive) */
export function nightsBetween(checkIn: string | Date, checkOut: string | Date): number {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.round((b.getTime() - a.getTime()) / (24 * 60 * 60 * 1000));
}

/** YYYY-MM-DD format (local) */
export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as YYYY-MM-DD */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Add days to YYYY-MM-DD string */
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

/** Vietnamese day-of-week label */
export function dowLabel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()];
}

/** Relative time tiếng Việt: "5ph", "2g", "Hôm qua", "3 ngày", "12/04" */
export function relativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = Date.now();
  const diff = now - d.getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'vừa xong';
  if (min < 60) return `${min}ph`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}g`;
  const day = Math.floor(hour / 24);
  if (day === 1) return 'Hôm qua';
  if (day < 7) return `${day} ngày`;
  return formatDate(d).slice(0, 5); // dd/MM
}

/** Phút từ thời điểm đó tới giờ (cho urgent check) */
export function minutesAgo(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 60_000));
}

/**
 * Hiển thị thời gian tự thích nghi:
 *  - < 7 ngày → relative (vừa xong / 5ph / 2g / Hôm qua / 3 ngày)
 *  - >= 7 ngày → dd/MM/yyyy (đầy đủ năm để tránh ambiguity)
 *
 * Dùng cho cột "Hoạt động gần nhất", audit-log, notification list…
 */
export function formatRelativeOrDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffDays = (Date.now() - d.getTime()) / (24 * 60 * 60 * 1000);
  if (diffDays < 7) return relativeTime(d);
  return formatDate(d);
}
