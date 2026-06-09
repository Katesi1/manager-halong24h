import { NotFoundError } from '@/core/errors';
import type {
  CreateLeadInput,
  Lead,
  LeadFilters,
  UpdateLeadInput,
} from '@/core/entities/lead';
import type { LeadRepository } from '@/application/ports/lead-repository';

let counter = 0;
const store: Lead[] = [];

export class MockLeadRepository implements LeadRepository {
  async create(input: CreateLeadInput): Promise<Lead> {
    counter += 1;
    const now = new Date().toISOString();
    const lead: Lead = {
      id: `lead-mock-${counter}`,
      propertyId: input.propertyId ?? null,
      propertyName: null,
      guestName: input.guestName,
      guestPhone: input.guestPhone,
      guestEmail: input.guestEmail ?? null,
      checkIn: input.checkIn ?? null,
      checkOut: input.checkOut ?? null,
      numGuests: input.numGuests ?? null,
      message: input.message ?? null,
      source: input.source ?? 'public_form',
      status: 'new',
      assignedToId: null,
      assignedToName: null,
      notes: null,
      contactedAt: null,
      contactedById: null,
      createdAt: now,
      updatedAt: now,
    };
    store.unshift(lead);
    return lead;
  }

  async list(filters?: LeadFilters): Promise<Lead[]> {
    return store.filter((l) => {
      if (filters?.status && l.status !== filters.status) return false;
      if (filters?.propertyId && l.propertyId !== filters.propertyId) return false;
      return true;
    });
  }

  async getById(id: string): Promise<Lead | null> {
    return store.find((l) => l.id === id) ?? null;
  }

  async update(input: UpdateLeadInput): Promise<Lead> {
    const lead = store.find((l) => l.id === input.id);
    if (!lead) throw new NotFoundError('Không tìm thấy lead');
    if (input.status !== undefined) lead.status = input.status;
    if (input.assignedToId !== undefined) lead.assignedToId = input.assignedToId;
    if (input.notes !== undefined) lead.notes = input.notes;
    if (input.status === 'contacted' && !lead.contactedAt) {
      lead.contactedAt = new Date().toISOString();
    }
    lead.updatedAt = new Date().toISOString();
    return lead;
  }
}
