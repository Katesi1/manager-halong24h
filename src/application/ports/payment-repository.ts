import type { Payment, PaymentFilters } from '@/core/entities/payment';

export interface PaymentRepository {
  list(filters?: PaymentFilters): Promise<Payment[]>;
  getById(id: string): Promise<Payment | null>;
}
