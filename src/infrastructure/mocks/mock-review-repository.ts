import { NotFoundError } from '@/core/errors';
import type {
  HideReviewInput,
  RestoreReviewInput,
  Review,
  ReviewFilters,
} from '@/core/entities/review';
import type { ReviewRepository } from '@/application/ports/review-repository';

const SEED: Review[] = [
  {
    id: 'rv-001',
    bookingId: 'mock-bk-001',
    bookingCode: 'HL-2026-04-0001',
    propertyId: 'prop-001',
    propertyName: 'Villa Hạ Long Bay View',
    ownerId: 'owner-001',
    ownerName: 'Chủ nhà Trần Đức Tuấn',
    customer: { id: 'cus-001', name: 'Nguyễn Thị Lan' },
    rating: 5,
    comment:
      'Villa siêu đẹp, view bao nguyên vịnh. Chủ nhà thân thiện, hỗ trợ nhiệt tình.',
    status: 'published',
    ownerReply: 'Cảm ơn anh chị đã ghé Halong24h. Hẹn gặp lại!',
    ownerReplyAt: '2026-04-22T10:00:00.000Z',
    flags: [],
    flagReason: null,
    hiddenBy: null,
    hiddenAt: null,
    hiddenReason: null,
    createdAt: '2026-04-20T14:00:00.000Z',
    updatedAt: '2026-04-22T10:00:00.000Z',
  },
  {
    id: 'rv-002',
    bookingId: 'mock-bk-002',
    bookingCode: 'HL-2026-04-0002',
    propertyId: 'prop-002',
    propertyName: 'Homestay Bãi Cháy',
    ownerId: 'owner-002',
    ownerName: 'Chủ nhà Phạm Văn An',
    customer: { id: 'cus-002', name: 'Hồ Văn Tài' },
    rating: 2,
    comment: 'Phòng hơi nóng, điều hoà không lạnh. Wifi yếu.',
    status: 'published',
    ownerReply: null,
    ownerReplyAt: null,
    flags: [],
    flagReason: null,
    hiddenBy: null,
    hiddenAt: null,
    hiddenReason: null,
    createdAt: '2026-04-25T18:00:00.000Z',
    updatedAt: '2026-04-25T18:00:00.000Z',
  },
  {
    id: 'rv-003',
    bookingId: 'mock-bk-003',
    bookingCode: 'HL-2026-04-0003',
    propertyId: 'prop-001',
    propertyName: 'Villa Hạ Long Bay View',
    ownerId: 'owner-001',
    ownerName: 'Chủ nhà Trần Đức Tuấn',
    customer: { id: 'cus-003', name: 'Anonymous123' },
    rating: 1,
    comment:
      'Chỗ này lừa đảo, đừng đặt. Liên hệ tôi 09xx-xxx-xxx nếu cần tư vấn villa khác giá rẻ.',
    status: 'published',
    ownerReply: null,
    ownerReplyAt: null,
    flags: ['spam', 'personal_info', 'fake'],
    flagReason: 'Chủ nhà báo review giả + đưa SĐT cạnh tranh.',
    hiddenBy: null,
    hiddenAt: null,
    hiddenReason: null,
    createdAt: '2026-05-01T09:00:00.000Z',
    updatedAt: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'rv-004',
    bookingId: 'mock-bk-004',
    bookingCode: 'HL-2026-04-0007',
    propertyId: 'prop-003',
    propertyName: 'Resort Vịnh Lan Hạ',
    ownerId: 'owner-003',
    ownerName: 'Chủ nhà Lê Hồng Sơn',
    customer: { id: 'cus-004', name: 'Nguyễn Bá Quốc' },
    rating: 4,
    comment: 'Phòng đẹp, sạch, đáng tiền. Sẽ quay lại.',
    status: 'published',
    ownerReply: null,
    ownerReplyAt: null,
    flags: [],
    flagReason: null,
    hiddenBy: null,
    hiddenAt: null,
    hiddenReason: null,
    createdAt: '2026-05-10T20:00:00.000Z',
    updatedAt: '2026-05-10T20:00:00.000Z',
  },
  {
    id: 'rv-005',
    bookingId: 'mock-bk-005',
    bookingCode: 'HL-2026-03-0019',
    propertyId: 'prop-002',
    propertyName: 'Homestay Bãi Cháy',
    ownerId: 'owner-002',
    ownerName: 'Chủ nhà Phạm Văn An',
    customer: { id: 'cus-005', name: 'Trương Văn Bình' },
    rating: 1,
    comment: 'Ngu *** chủ nhà. Phục vụ như c**.',
    status: 'hidden',
    ownerReply: null,
    ownerReplyAt: null,
    flags: ['profanity'],
    flagReason: 'Ngôn từ tục tĩu',
    hiddenBy: { id: 'dev-admin', name: 'Quản trị viên' },
    hiddenAt: '2026-03-25T10:00:00.000Z',
    hiddenReason: 'Vi phạm chính sách ngôn ngữ. Khách flag warning.',
    createdAt: '2026-03-24T22:00:00.000Z',
    updatedAt: '2026-03-25T10:00:00.000Z',
  },
];

const store = new Map<string, Review>(SEED.map((r) => [r.id, r]));

function matchesFilters(r: Review, f: ReviewFilters): boolean {
  if (f.status && r.status !== f.status) return false;
  if (f.rating && r.rating !== f.rating) return false;
  if (f.flagged && r.flags.length === 0) return false;
  if (f.propertyId && r.propertyId !== f.propertyId) return false;
  if (f.ownerId && r.ownerId !== f.ownerId) return false;
  if (f.search) {
    const q = f.search.toLowerCase();
    const hay =
      `${r.customer.name} ${r.propertyName} ${r.ownerName} ${r.comment} ${r.bookingCode}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export class MockReviewRepository implements ReviewRepository {
  async list(filters: ReviewFilters = {}): Promise<Review[]> {
    return Array.from(store.values())
      .filter((r) => matchesFilters(r, filters))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getById(id: string): Promise<Review | null> {
    return store.get(id) ?? null;
  }

  async countFlagged(): Promise<number> {
    return Array.from(store.values()).filter(
      (r) => r.flags.length > 0 && r.status === 'published',
    ).length;
  }

  async hide(
    input: HideReviewInput & { hiddenBy: { id: string; name: string } },
  ): Promise<Review> {
    const review = store.get(input.reviewId);
    if (!review) throw new NotFoundError('Không tìm thấy review');
    const updated: Review = {
      ...review,
      status: 'hidden',
      hiddenBy: input.hiddenBy,
      hiddenAt: new Date().toISOString(),
      hiddenReason: input.reason,
      updatedAt: new Date().toISOString(),
    };
    store.set(updated.id, updated);
    return updated;
  }

  async restore(input: RestoreReviewInput): Promise<Review> {
    const review = store.get(input.reviewId);
    if (!review) throw new NotFoundError('Không tìm thấy review');
    const updated: Review = {
      ...review,
      status: 'published',
      hiddenBy: null,
      hiddenAt: null,
      hiddenReason: null,
      updatedAt: new Date().toISOString(),
    };
    store.set(updated.id, updated);
    return updated;
  }
}
