import { Badge } from '@/components/ui/badge';
import { GUEST_LABEL_LABEL, type GuestLabel } from '@/core/entities/guest';
import type { BadgeVariant } from '@/lib/booking-display';

const LABEL_VARIANT: Record<GuestLabel, BadgeVariant> = {
  vip: 'gold',
  regular: 'info',
  new: 'success',
  restricted: 'danger',
};

export function GuestLabelBadge({ label }: { label: GuestLabel }) {
  return <Badge variant={LABEL_VARIANT[label]}>{GUEST_LABEL_LABEL[label]}</Badge>;
}
