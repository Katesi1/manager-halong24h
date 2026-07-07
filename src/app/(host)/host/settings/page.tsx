import type { Metadata } from 'next';

import { SettingsClient } from '@/components/host/settings-client';

export const metadata: Metadata = { title: 'Cài đặt cá nhân' };

export default function HostSettingsPage() {
  // Profile + KYC fetch phía CLIENT từ /api/host/settings → hiện trong Network
  return <SettingsClient />;
}
