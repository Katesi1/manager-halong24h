/**
 * Lead — spec §15.
 *
 * Public form submission: khách quan tâm để lại thông tin. OWNER/SALE/ADMIN
 * theo dõi và follow-up.
 */

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'rejected'
  | 'expired'
  | 'converted';

export type LeadSource =
  | 'public_form'
  | 'landing_page'
  | 'partner'
  | 'manual';

export interface Lead {
  id: string;
  propertyId: string | null;
  propertyName: string | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  checkIn: string | null;
  checkOut: string | null;
  numGuests: number | null;
  message: string | null;
  source: LeadSource;
  status: LeadStatus;
  assignedToId: string | null;
  assignedToName: string | null;
  notes: string | null;
  contactedAt: string | null;
  contactedById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  propertyId?: string;
  page?: number;
  limit?: number;
}

export interface CreateLeadInput {
  propertyId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  checkIn?: string;
  checkOut?: string;
  numGuests?: number;
  message?: string;
  source?: LeadSource;
}

export interface UpdateLeadInput {
  id: string;
  status?: LeadStatus;
  assignedToId?: string | null;
  notes?: string;
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  rejected: 'Từ chối',
  expired: 'Hết hạn',
  converted: 'Đã chuyển booking',
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  public_form: 'Form công khai',
  landing_page: 'Landing page',
  partner: 'Đối tác',
  manual: 'Nhập tay',
};
