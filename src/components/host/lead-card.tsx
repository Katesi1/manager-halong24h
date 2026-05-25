import Link from 'next/link';
import { GradientAvatar } from '@/components/ui/gradient-avatar';
import { Badge } from '@/components/ui/badge';
import { relativeTime, minutesAgo, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Zap } from 'lucide-react';
import type { LeadStatus } from '@/lib/legacy-types';

export interface LeadCardData {
  id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  check_in: string | null;
  check_out: string | null;
  num_guests: number | null;
  message: string | null;
  status: LeadStatus;
  created_at: string;
  property_name: string;
  room_name: string | null;
}

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: '● Mới',
  contacted: 'Đã liên hệ',
  converted: 'Đã chốt',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
};
const STATUS_VARIANT: Record<LeadStatus, Parameters<typeof Badge>[0]['variant']> = {
  new: 'danger',
  contacted: 'info',
  converted: 'success',
  rejected: 'default',
  expired: 'default',
};

interface Props {
  lead: LeadCardData;
}

export function LeadCard({ lead }: Props) {
  const ageMin = minutesAgo(lead.created_at);
  const isUrgent = lead.status === 'new' && ageMin < 30;
  const nights =
    lead.check_in && lead.check_out
      ? Math.round(
          (new Date(lead.check_out).getTime() - new Date(lead.check_in).getTime()) / 86_400_000,
        )
      : null;

  return (
    <Link
      href={`/host/leads/${lead.id}`}
      className={cn(
        'group relative block rounded-2xl bg-white p-4 ring-1 transition-all hover:shadow-md',
        isUrgent
          ? 'ring-rose-300 bg-gradient-to-b from-rose-50/40 to-white'
          : 'ring-ink-200 hover:ring-ink-300',
      )}
    >
      {isUrgent && (
        <span className="absolute left-0 top-4 h-9 w-1 rounded-r-full bg-rose-500" />
      )}

      {/* Head */}
      <div className="flex items-start gap-3">
        <GradientAvatar name={lead.guest_name} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-ink-900 truncate">{lead.guest_name}</h3>
            <Badge variant={STATUS_VARIANT[lead.status]}>{STATUS_LABEL[lead.status]}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-ink-500 truncate">
            {lead.guest_phone} · Đặt qua web
          </p>
        </div>
        <div
          className={cn(
            'shrink-0 flex items-center gap-0.5 text-xs font-bold',
            isUrgent ? 'text-rose-600' : 'text-ink-500',
          )}
        >
          {isUrgent && <Zap className="h-3 w-3" fill="currentColor" />}
          {relativeTime(lead.created_at)}
        </div>
      </div>

      {/* Body box */}
      {(lead.room_name || lead.check_in || lead.message) && (
        <div className="mt-3 rounded-lg bg-cream-100 p-3 text-xs text-ink-700 leading-relaxed space-y-0.5">
          {lead.room_name && (
            <div>
              <span className="text-ink-500">Phòng:</span>{' '}
              <span className="font-semibold text-ink-900">{lead.room_name}</span>
            </div>
          )}
          {lead.check_in && lead.check_out && (
            <div>
              <span className="text-ink-500">Ngày:</span>{' '}
              <span className="font-semibold text-ink-900">
                {formatDate(lead.check_in).slice(0, 5)} →{' '}
                {formatDate(lead.check_out).slice(0, 5)}
              </span>
              {nights && <span> ({nights} đêm)</span>}
              {lead.num_guests && (
                <>
                  {' · '}
                  <span className="font-semibold text-ink-900">{lead.num_guests} khách</span>
                </>
              )}
            </div>
          )}
          {lead.message && (
            <p className="mt-1 italic text-ink-500 line-clamp-2">"{lead.message}"</p>
          )}
        </div>
      )}

      {/* Quick info if no body */}
      {!lead.room_name && !lead.check_in && !lead.message && (
        <p className="mt-2 text-xs italic text-ink-500">Khách chưa cung cấp chi tiết — bấm vào để xem</p>
      )}
    </Link>
  );
}
