import type {
  FreezeInput,
  MarkPaidInput,
  Subscription,
  SubscriptionCallLog,
  SubscriptionFilters,
  SubscriptionInvoice,
} from '@/core/entities/subscription';

export interface SubscriptionRepository {
  list(filters?: SubscriptionFilters): Promise<Subscription[]>;
  getById(id: string): Promise<Subscription | null>;
  /** Subscription hiện hành của 1 owner (mới nhất chưa expired). */
  getCurrentForOwner(ownerId: string): Promise<Subscription | null>;
  /** Lịch sử hoá đơn gói cước của owner đang đăng nhập (SALE → owner của mình). */
  listMyInvoices(): Promise<SubscriptionInvoice[]>;
  countOverdue(): Promise<number>;
  /** Tổng đã thu trong khoảng (ms epoch). */
  sumPaidBetween(from: string, to: string): Promise<number>;
  markPaid(input: MarkPaidInput): Promise<Subscription>;
  freeze(input: FreezeInput): Promise<Subscription>;
  unfreeze(subscriptionId: string): Promise<Subscription>;
  /** Thêm ghi chú cuộc gọi đòi nợ (admin). `userId` = OWNER userId. */
  addCallLog(userId: string, note: string): Promise<SubscriptionCallLog>;
  /** Danh sách ghi chú cuộc gọi (newest-first), kèm hydrate admin. */
  listCallLogs(userId: string): Promise<SubscriptionCallLog[]>;
}
