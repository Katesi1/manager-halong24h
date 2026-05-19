import type { Payment, PaymentFilters } from '@/core/entities/payment';
import type { PaymentRepository } from '../ports/payment-repository';

export async function listPaymentsUseCase(
  repo: PaymentRepository,
  filters?: PaymentFilters,
): Promise<Payment[]> {
  return repo.list(filters);
}
