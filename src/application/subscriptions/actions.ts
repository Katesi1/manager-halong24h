import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type {
  Subscription,
  SubscriptionCallLog,
  SubscriptionFilters,
  SubscriptionInvoice,
} from '@/core/entities/subscription';
import type { SubscriptionRepository } from '../ports/subscription-repository';

export async function listSubscriptionsUseCase(
  repo: SubscriptionRepository,
  filters?: SubscriptionFilters,
): Promise<Subscription[]> {
  return repo.list(filters);
}

export async function getSubscriptionUseCase(
  repo: SubscriptionRepository,
  id: string,
): Promise<Subscription | null> {
  if (!id) return null;
  return repo.getById(id);
}

export async function getCurrentSubscriptionUseCase(
  repo: SubscriptionRepository,
  ownerId: string,
): Promise<Subscription | null> {
  if (!ownerId) return null;
  return repo.getCurrentForOwner(ownerId);
}

export async function listMyInvoicesUseCase(
  repo: SubscriptionRepository,
): Promise<SubscriptionInvoice[]> {
  return repo.listMyInvoices();
}

export async function countOverdueSubscriptionsUseCase(
  repo: SubscriptionRepository,
): Promise<number> {
  return repo.countOverdue();
}

export async function sumPaidBetweenUseCase(
  repo: SubscriptionRepository,
  from: string,
  to: string,
): Promise<number> {
  return repo.sumPaidBetween(from, to);
}

const MarkPaidSchema = z.object({
  subscriptionId: z.string().min(1),
  paidAmount: z
    .number({ invalid_type_error: 'Số tiền không hợp lệ' })
    .int('Số tiền phải là số nguyên')
    .positive('Số tiền phải lớn hơn 0')
    .max(10_000_000_000, 'Số tiền quá lớn'),
  // Nâng gói thủ công (optional — bỏ trống thì BE giữ giá trị hiện tại).
  planId: z.string().trim().min(1).max(64).optional(),
  cycle: z.enum(['monthly', 'yearly']).optional(),
  rooms: z.number().int().min(1).max(10_000).optional(),
  days: z.number().int().min(1).max(3650).optional(),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(2000).optional(),
});

export async function markSubscriptionPaidUseCase(
  repo: SubscriptionRepository,
  raw: unknown,
): Promise<Subscription> {
  const parsed = MarkPaidSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu thanh toán không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.markPaid(parsed.data);
}

const FreezeSchema = z.object({
  subscriptionId: z.string().min(1),
  reason: z.string().min(5, 'Lý do tối thiểu 5 ký tự').max(500),
});

export async function freezeSubscriptionUseCase(
  repo: SubscriptionRepository,
  raw: unknown,
): Promise<Subscription> {
  const parsed = FreezeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Dữ liệu freeze không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.freeze(parsed.data);
}

export async function unfreezeSubscriptionUseCase(
  repo: SubscriptionRepository,
  subscriptionId: string,
): Promise<Subscription> {
  if (!subscriptionId) throw new ValidationError('Thiếu mã subscription');
  return repo.unfreeze(subscriptionId);
}

const CallLogSchema = z.object({
  userId: z.string().min(1, 'Thiếu mã người dùng'),
  note: z
    .string()
    .trim()
    .min(3, 'Ghi chú tối thiểu 3 ký tự')
    .max(2000, 'Ghi chú tối đa 2000 ký tự'),
});

export async function addSubscriptionCallLogUseCase(
  repo: SubscriptionRepository,
  raw: unknown,
): Promise<SubscriptionCallLog> {
  const parsed = CallLogSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Ghi chú cuộc gọi không hợp lệ',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.addCallLog(parsed.data.userId, parsed.data.note);
}

export async function listSubscriptionCallLogsUseCase(
  repo: SubscriptionRepository,
  userId: string,
): Promise<SubscriptionCallLog[]> {
  if (!userId) throw new ValidationError('Thiếu mã người dùng');
  return repo.listCallLogs(userId);
}
