import { LeadDetailClient } from '@/components/host/lead-detail-client';

export default async function LeadDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-28">
      {/* Dữ liệu fetch phía CLIENT từ /api/leads/:id → hiện endpoint trong Network */}
      <LeadDetailClient id={id} />
    </div>
  );
}
