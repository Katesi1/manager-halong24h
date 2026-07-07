import type { Metadata } from 'next';

import { AdminReportsClient } from '@/components/admin/admin-reports-client';
import { isRiskRange, type RiskRange } from '@/core/entities/risk-kpi';

export const metadata: Metadata = { title: 'Báo cáo' };

export default async function AdminReportsPage(props: {
  searchParams: Promise<{ range?: string }>;
}) {
  const sp = await props.searchParams;
  const range: RiskRange = isRiskRange(sp.range) ? sp.range : 'month';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Dữ liệu fetch phía CLIENT từ /api/admin/reports → hiện endpoint trong Network */}
      <AdminReportsClient range={range} />
    </div>
  );
}
