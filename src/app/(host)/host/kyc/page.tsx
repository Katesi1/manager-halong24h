import type { Metadata } from 'next';

import { HostKycClient } from '@/components/host/host-kyc-client';

export const metadata: Metadata = { title: 'Xác minh KYC' };

export default function HostKycPage() {
  // Trạng thái KYC fetch phía CLIENT từ /api/host/kyc → hiện trong Network
  return <HostKycClient />;
}
