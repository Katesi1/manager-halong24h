/**
 * Kết quả "cổng chặn" (guard) do BFF route enforce PHÍA SERVER (role/KYC/gói
 * cước) trả về cho client render `<GuardBanner>`. Việc chặn vẫn thực thi ở
 * server (route handler + BE), client chỉ hiển thị.
 */
export interface HostGate {
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}
