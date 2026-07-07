import type { Metadata } from 'next';

import { PropertyNewClient } from '@/components/host/property-new-client';

export const metadata: Metadata = { title: 'Thêm cơ sở' };

export default function NewPropertyPage() {
  // Cổng chặn + wizard fetch phía CLIENT từ /api/host/property-new-gate → Network
  return <PropertyNewClient />;
}
