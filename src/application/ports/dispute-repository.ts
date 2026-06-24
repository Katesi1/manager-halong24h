import type { OpenDisputeData } from '@/application/disputes/open';
import type {
  Dispute,
  DisputeFilters,
  RejectDisputeInput,
  ResolveDisputeInput,
} from '@/core/entities/dispute';

export interface DisputeRepository {
  list(filters?: DisputeFilters): Promise<Dispute[]>;
  getById(id: string): Promise<Dispute | null>;
  /** Đếm open + investigating cho dashboard alert */
  countActive(): Promise<number>;
  /** Customer / Owner / Admin mở dispute mới */
  open(input: OpenDisputeData): Promise<Dispute>;
  /** Set status=investigating, log admin nhận case */
  startInvestigation(id: string): Promise<Dispute>;
  /**
   * Resolve + verdict + penalty. `input.penaltyAction` (enum phẳng, optional)
   * được gửi xuống BE qua body field `penalty`. KHÔNG tự ban user.
   */
  resolve(input: ResolveDisputeInput): Promise<Dispute>;
  /** Reject với lý do */
  reject(input: RejectDisputeInput): Promise<Dispute>;
}
