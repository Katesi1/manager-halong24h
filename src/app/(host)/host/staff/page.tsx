import { InviteStaffForm } from '@/components/host/invite-staff-form';
import { PageHeader } from '@/components/host/page-header';
import { StaffListsClient } from '@/components/host/staff-lists-client';

export default function HostStaffPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <PageHeader
        title="Nhân viên SALE"
        description="Mời SALE qua email. SALE accept tạo tài khoản role=2 và được gán vào bạn."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Dữ liệu fetch phía CLIENT từ /api/staff → hiện endpoint trong Network */}
        <StaffListsClient />

        <aside
          id="invite-form"
          className="rounded-2xl bg-white p-5 ring-1 ring-ink-200/60 shadow-card h-fit scroll-mt-20"
        >
          <h3 className="font-display text-2xl font-semibold tracking-tight text-navy-900">
            Mời SALE mới
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Cần KYC approved + subscription active.
          </p>
          <div className="mt-4">
            <InviteStaffForm />
          </div>
        </aside>
      </div>
    </div>
  );
}
