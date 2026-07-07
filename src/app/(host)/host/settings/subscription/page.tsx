import type { Metadata } from 'next';

import { SubscriptionClient } from '@/components/host/subscription-client';

export const metadata: Metadata = { title: 'Gói cước' };

export default function HostSubscriptionPage() {
  // Gói cước fetch phía CLIENT từ /api/host/subscription → hiện trong Network
  return <SubscriptionClient />;
}
