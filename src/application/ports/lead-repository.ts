import type {
  CreateLeadInput,
  Lead,
  LeadFilters,
  UpdateLeadInput,
} from '@/core/entities/lead';

export interface LeadRepository {
  /** Public — POST /leads (rate-limit 10/phút/IP). */
  create(input: CreateLeadInput): Promise<Lead>;
  /** Auth — GET /leads (OWNER/SALE: của mình; ADMIN: tất cả). */
  list(filters?: LeadFilters): Promise<Lead[]>;
  /** Auth — GET /leads/:id */
  getById(id: string): Promise<Lead | null>;
  /** Auth — PATCH /leads/:id */
  update(input: UpdateLeadInput): Promise<Lead>;
}
