import type { VND } from '../value-objects/vnd';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'failed';
export type PaymentMethod = 'vietqr' | 'cash' | 'card' | 'transfer';

export interface Payment {
  id: string;
  bookingId: string;
  bookingCode: string;
  guestName: string;
  amount: VND;
  method: PaymentMethod;
  status: PaymentStatus;
  paidAt: string | null;
  reference: string | null;
  createdAt: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  bookingId?: string;
  from?: string;
  to?: string;
}
