import type { VND } from '../value-objects/vnd';

export interface DashboardStats {
  totalRooms: number;
  activeRooms: number;
  emptyRooms: number;
  occupiedRooms: number;
  globalTotalRooms: number;
  globalEmptyRooms: number;
  checkoutToday: number;
  totalBookings: number;
  thisMonthBookings: number;
  monthlyRevenue: VND;
  todayRevenue: VND;
}

export type ReportPeriod = 'today' | 'week' | 'month' | 'year' | 'custom';

export interface ReportFilters {
  period?: ReportPeriod;
  from?: string;
  to?: string;
  month?: number;
  year?: number;
}

export interface RevenueByDayPoint {
  date: string;
  revenue: VND;
  bookings: number;
  occupancy: number;
}

export interface TopRoom {
  roomId: string;
  name: string;
  coverImage: string | null;
  revenue: VND;
  bookings: number;
  occupancy: number;
}

export interface RatingBreakdown {
  cleanliness: number;
  location: number;
  amenities: number;
  service: number;
  value: number;
  accuracy: number;
}

export interface RatingDistribution {
  '5': number;
  '4': number;
  '3': number;
  '2': number;
  '1': number;
}

export interface RatingSummary {
  avgRating: number;
  totalReviews: number;
  totalProperties: number;
  distribution: RatingDistribution;
  breakdown: RatingBreakdown;
}

export interface PropertyRating {
  propertyId: string;
  propertyName: string;
  coverImage: string | null;
  avgRating: number;
  totalReviews: number;
  distribution: RatingDistribution;
  breakdown: RatingBreakdown;
}

export interface RecentReview {
  id: string;
  propertyId: string;
  propertyName: string;
  customerName: string;
  customerAvatar: string | null;
  rating: number;
  comment: string;
  photos: string[];
  createdAt: string;
}

export interface DashboardReport {
  totalRooms: number;
  activeRooms: number;
  totalBookings: number;
  thisMonthBookings: number;
  holdCount: number;
  confirmedCount: number;
  cancelledCount: number;
  completedCount: number;
  totalDeposit: VND;
  occupancyRate: number;
  roomsWithCover: number;
  roomsWithPrice: number;
  revenue: VND;
  adr: VND;
  revenueByDay: RevenueByDayPoint[];
  topRooms: TopRoom[];
  previousPeriod: {
    revenue: VND;
    bookings: number;
    occupancy: number;
    adr: VND;
  };
  ratingSummary: RatingSummary;
  propertyRatings: PropertyRating[];
  recentReviews: RecentReview[];
  lengthOfStay: {
    oneNight: number;
    twoToThree: number;
    fourToSeven: number;
    eightPlus: number;
  };
  dayOfWeekOccupancy: { values: number[] };
  recentBookings: unknown[]; // Full BookingDto — sẽ định nghĩa khi có API booking
}
