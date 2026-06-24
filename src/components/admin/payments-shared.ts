/** Hằng số + helper dùng chung cho trang gộp `/admin/payments` (2 view). */

export const PAYMENTS_PAGE_SIZE = 10;

/** Build URL `/admin/payments?...` bỏ qua param rỗng. */
export function buildPaymentsHref(
  params: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) sp.set(k, v);
  }
  const qs = sp.toString();
  return qs ? `/admin/payments?${qs}` : '/admin/payments';
}
