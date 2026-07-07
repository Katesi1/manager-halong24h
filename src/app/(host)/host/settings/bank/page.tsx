import type { Metadata } from 'next';

import { BankSettingsClient } from '@/components/host/bank-settings-client';

export const metadata: Metadata = { title: 'Tài khoản nhận tiền' };

export default function HostBankAccountPage() {
  // STK nhận tiền fetch phía CLIENT từ /api/host/bank → hiện trong Network
  return <BankSettingsClient />;
}
