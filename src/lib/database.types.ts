// Legacy domain types — giữ lại để các page UI demo dùng (không phụ thuộc DB nào).
// Đây là tập string-literal unions + interface dùng cho hiển thị mock data.
// Khi mọi page legacy migrate sang Clean Arch (core/entities/*) có thể xoá file này.

export type UserRole = 'super_admin' | 'owner' | 'sale' | 'housekeeping' | 'customer';
export type PropertyStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type BookingMode = 'lead_only' | 'lead_and_pay';
export type RoomStatus = 'active' | 'paused' | 'maintenance';
export type BookingStatus =
  | 'pending'
  | 'hold'
  | 'confirmed'
  | 'checked_in'
  | 'checked_out'
  | 'cancelled';
export type BookingSource = 'walkin' | 'web' | 'lead' | 'phone';
export type LeadStatus = 'new' | 'contacted' | 'converted' | 'rejected' | 'expired';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'vietqr' | 'momo';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

// New enums (migration 0007)
export type TenantStatus = 'pending' | 'active' | 'frozen' | 'rejected';
export type TenantMemberRole = 'owner' | 'sale' | 'housekeeping';
export type SubscriptionTier = 'free' | 'basic' | 'standard' | 'pro';
export type SubscriptionStatus = 'active' | 'overdue' | 'frozen';
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
export type PricingRuleType = 'weekend' | 'seasonal' | 'override';
export type PricingAdjustmentType = 'percent' | 'flat';
export type HkTaskType = 'clean' | 'inspect' | 'restock';
export type HkTaskStatus = 'pending' | 'in_progress' | 'done' | 'rejected';
export type HkIssueSeverity = 'minor' | 'medium' | 'urgent';
export type HkIssueStatus = 'open' | 'fixing' | 'closed';
export type DisputeStatus = 'open' | 'investigating' | 'resolved' | 'rejected';

// ===========================================================================
// Existing tables
// ===========================================================================

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  owner_id: string;
  tenant_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  ward: string | null;
  district: string | null;
  lat: number | null;
  lng: number | null;
  amenities: string[];
  check_in_time: string | null;
  check_out_time: string | null;
  cancel_policy: string | null;
  house_rules: string | null;
  status: PropertyStatus;
  rejection_reason: string | null;
  is_published: boolean;
  booking_mode: BookingMode;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  created_at: string;
}

export interface Room {
  id: string;
  property_id: string;
  name: string;
  room_type: string | null;
  area_sqm: number | null;
  capacity: number;
  bed_count: number | null;
  amenities: string[];
  description: string | null;
  base_price: number;
  weekend_price: number | null;
  status: RoomStatus;
  cover_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomImage {
  id: string;
  room_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
  created_at: string;
}

export interface RoomBlock {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  code: string;
  property_id: string;
  room_id: string;
  customer_id: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  num_guests: number;
  check_in: string;
  check_out: string;
  total_amount: number;
  deposit_amount: number;
  paid_amount: number;
  notes: string | null;
  internal_notes: string | null;
  status: BookingStatus;
  source: BookingSource;
  cancel_reason: string | null;
  cancelled_at: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  property_id: string;
  room_id: string | null;
  guest_name: string;
  guest_phone: string;
  guest_email: string | null;
  check_in: string | null;
  check_out: string | null;
  num_guests: number | null;
  message: string | null;
  status: LeadStatus;
  booking_id: string | null;
  responded_at: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string | null;
  bank_transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  property_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  owner_reply: string | null;
  owner_replied_at: string | null;
  is_published: boolean;
  created_at: string;
}

// ===========================================================================
// New tables (migration 0007)
// ===========================================================================

export interface Tenant {
  id: string;
  owner_id: string;
  business_name: string;
  cccd_front_url: string | null;
  cccd_back_url: string | null;
  license_url: string | null;
  status: TenantStatus;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  tenant_id: string;
  user_id: string;
  role: TenantMemberRole;
  invited_at: string;
  accepted_at: string | null;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  tier: SubscriptionTier;
  room_count: number;
  monthly_fee: number;
  status: SubscriptionStatus;
  next_billing_date: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  tenant_id: string;
  subscription_id: string | null;
  code: string;
  period_month: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: InvoiceStatus;
  created_at: string;
}

export interface PricingRule {
  id: string;
  property_id: string | null;
  room_id: string | null;
  type: PricingRuleType;
  priority: number;
  start_date: string | null;
  end_date: string | null;
  weekdays: number[] | null;
  adjustment_type: PricingAdjustmentType;
  adjustment_value: number;
  label: string | null;
  created_at: string;
}

export interface HkTask {
  id: string;
  room_id: string;
  related_booking_id: string | null;
  type: HkTaskType;
  status: HkTaskStatus;
  assigned_to: string | null;
  due_at: string | null;
  done_at: string | null;
  photos_before: string[];
  photos_after: string[];
  notes: string | null;
  created_at: string;
}

export interface HkIssue {
  id: string;
  room_id: string;
  reported_by: string | null;
  category: string | null;
  severity: HkIssueSeverity;
  description: string | null;
  photos: string[];
  status: HkIssueStatus;
  resolved_at: string | null;
  created_at: string;
}

export interface Guest {
  id: string;
  tenant_id: string;
  phone: string;
  full_name: string | null;
  email: string | null;
  total_bookings: number;
  total_spent: number;
  tags: string[];
  notes_internal: string | null;
  last_visit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  opened_by: string | null;
  type: string | null;
  amount: number | null;
  description: string | null;
  evidence_urls: string[];
  status: DisputeStatus;
  resolution: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: string | null;
  tenant_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  meta: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

// ===========================================================================
// Convenience joined types
// ===========================================================================

export interface PropertyWithRooms extends Property {
  rooms: Room[];
  property_images: PropertyImage[];
}

export interface RoomWithImages extends Room {
  room_images: RoomImage[];
}

// ===========================================================================
// Tier pricing constants (match calculate_monthly_fee SQL function)
// ===========================================================================

export const TIER_PRICE_PER_ROOM: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 50_000,
  standard: 40_000,
  pro: 30_000,
};

export const TIER_ROOM_RANGE: Record<SubscriptionTier, string> = {
  free: '1-3 phòng',
  basic: '4-10 phòng',
  standard: '11-30 phòng',
  pro: '31+ phòng',
};

export function calculateTier(roomCount: number): SubscriptionTier {
  if (roomCount <= 3) return 'free';
  if (roomCount <= 10) return 'basic';
  if (roomCount <= 30) return 'standard';
  return 'pro';
}
