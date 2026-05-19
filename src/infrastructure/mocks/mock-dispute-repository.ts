import 'server-only';

import { NotFoundError } from '@/core/errors';
import type { OpenDisputeData } from '@/application/disputes/open';
import type {
  Dispute,
  DisputeFilters,
  RejectDisputeInput,
  ResolveDisputeInput,
} from '@/core/entities/dispute';
import type { DisputeRepository } from '@/application/ports/dispute-repository';

const SEED: Dispute[] = [
  {
    id: 'dis-001',
    bookingId: 'mock-bk-001',
    bookingCode: 'HL-2026-04-0034',
    propertyId: 'mock-prop-001',
    propertyName: 'Villa B1716 — View biển Bãi Cháy',
    customer: {
      id: 'cus-001',
      name: 'Lê Văn Đức',
      email: 'leduc@example.com',
      phone: '0901234567',
    },
    owner: {
      id: 'owner-001',
      name: 'Nguyễn Văn An',
      email: 'owner1@gmail.com',
      phone: '0912345678',
    },
    opener: { role: 'customer', name: 'Lê Văn Đức' },
    type: 'quality',
    status: 'open',
    priority: 'high',
    subject: 'Phòng quảng cáo "view biển" nhưng thực tế nhìn vào tường',
    description:
      'Tôi đặt căn được quảng cáo "Premium View Vịnh" với giá 4.500.000đ/đêm × 2 đêm = 9.000.000đ. Khi đến nơi, phòng nhìn ra tường, không có view biển nào. Yêu cầu hoàn 50% (2.250.000đ).',
    amount: 2_250_000,
    evidence: [
      {
        id: 'ev-001',
        type: 'image',
        url: 'https://placehold.co/800x600?text=View+thuc+te+tu+phong',
        caption: 'Ảnh chụp view thực tế từ ban công',
        uploadedBy: {
          id: 'cus-001',
          name: 'Lê Văn Đức',
          role: 'customer',
        },
        uploadedAt: '2026-04-25T20:00:00.000Z',
      },
      {
        id: 'ev-002',
        type: 'image',
        url: 'https://placehold.co/800x600?text=Quang+cao+tren+listing',
        caption: 'Screenshot quảng cáo trên trang Halong24h',
        uploadedBy: {
          id: 'cus-001',
          name: 'Lê Văn Đức',
          role: 'customer',
        },
        uploadedAt: '2026-04-25T20:05:00.000Z',
      },
    ],
    chatExcerpts: [
      {
        id: 'cx-001',
        messageId: 'msg-1001',
        content:
          'Chào bạn, mình muốn đặt căn Premium View Vịnh ngày 24-26/04, có còn không ạ?',
        sender: { id: 'cus-001', name: 'Lê Văn Đức', role: 'customer' },
        sentAt: '2026-04-20T10:30:00.000Z',
      },
      {
        id: 'cx-002',
        messageId: 'msg-1002',
        content:
          'Dạ còn ạ. Căn này tầng 22, view trực diện vịnh, có ban công riêng. Giá 4.5tr/đêm, 2 đêm tổng 9tr nhé.',
        sender: { id: 'owner-001', name: 'Nguyễn Văn An', role: 'owner' },
        sentAt: '2026-04-20T10:35:00.000Z',
      },
      {
        id: 'cx-003',
        messageId: 'msg-1010',
        content:
          'Chú ơi, mình đã check-in. Nhưng phòng này nhìn ra tường, không phải view biển như đã hứa. Sao vậy ạ?',
        sender: { id: 'cus-001', name: 'Lê Văn Đức', role: 'customer' },
        sentAt: '2026-04-25T15:00:00.000Z',
        attachmentUrl: 'https://placehold.co/400x300?text=Anh+phong+thuc',
      },
      {
        id: 'cx-004',
        messageId: 'msg-1011',
        content:
          'À, hôm nay căn 22 bận, anh xếp bạn căn 18 thay thế, cũng cùng diện tích.',
        sender: { id: 'owner-001', name: 'Nguyễn Văn An', role: 'owner' },
        sentAt: '2026-04-25T15:30:00.000Z',
      },
    ],
    verdict: null,
    penalty: null,
    resolution: null,
    createdAt: '2026-04-25T20:00:00.000Z',
    updatedAt: '2026-04-25T20:05:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
  },
  {
    id: 'dis-002',
    bookingId: 'mock-bk-002',
    bookingCode: 'HL-2026-04-0028',
    propertyId: 'mock-prop-002',
    propertyName: 'Homestay Hòn Gai Sky',
    customer: {
      id: 'cus-002',
      name: 'Vũ Quỳnh Anh',
      email: 'quynh.vu@example.com',
      phone: '0987654321',
    },
    owner: {
      id: 'owner-002',
      name: 'Trần Thị Bình',
      email: 'binh.tran@gmail.com',
      phone: '0987654321',
    },
    opener: { role: 'customer', name: 'Vũ Quỳnh Anh' },
    type: 'refund',
    status: 'investigating',
    priority: 'medium',
    subject:
      'Đã chuyển 1.500.000đ nhưng chủ nhà bảo chỉ nhận 1.000.000đ',
    description:
      'Tôi đã chuyển khoản đúng 1.500.000đ cọc theo email xác nhận. Có sao kê ngân hàng. Chủ nhà bảo chỉ nhận 1tr và yêu cầu chuyển thêm. Có thể chủ nhà nhầm hoặc cố ý.',
    amount: 500_000,
    evidence: [
      {
        id: 'ev-101',
        type: 'image',
        url: 'https://placehold.co/800x600?text=Sao+ke+Vietcombank',
        caption: 'Sao kê Vietcombank thể hiện chuyển 1.500.000đ',
        uploadedBy: {
          id: 'cus-002',
          name: 'Vũ Quỳnh Anh',
          role: 'customer',
        },
        uploadedAt: '2026-04-26T11:00:00.000Z',
      },
    ],
    chatExcerpts: [
      {
        id: 'cx-101',
        messageId: 'msg-2001',
        content:
          'Em đã chuyển khoản 1.500.000đ rồi anh ơi, gửi anh bill ạ.',
        sender: { id: 'cus-002', name: 'Vũ Quỳnh Anh', role: 'customer' },
        sentAt: '2026-04-26T10:00:00.000Z',
        attachmentUrl: 'https://placehold.co/400x600?text=Bill+chuyen+1.5tr',
      },
      {
        id: 'cx-102',
        messageId: 'msg-2002',
        content:
          'Anh check rồi, chỉ thấy 1tr về tài khoản thôi. Em chuyển thêm 500k nữa nhé.',
        sender: { id: 'owner-002', name: 'Trần Thị Bình', role: 'owner' },
        sentAt: '2026-04-26T10:30:00.000Z',
      },
    ],
    verdict: null,
    penalty: null,
    resolution: null,
    createdAt: '2026-04-26T11:00:00.000Z',
    updatedAt: '2026-04-26T11:30:00.000Z',
    resolvedAt: null,
    resolvedBy: null,
  },
  {
    id: 'dis-003',
    bookingId: 'mock-bk-003',
    bookingCode: 'HL-2026-04-0011',
    propertyId: 'mock-prop-003',
    propertyName: 'Penthouse 28 — Marina',
    customer: {
      id: 'cus-003',
      name: 'Nguyễn Văn Z',
      email: 'z.nguyen@example.com',
      phone: '0901111000',
    },
    owner: {
      id: 'owner-003',
      name: 'Phạm Hữu Cường',
      email: 'cuong.pham@gmail.com',
      phone: '0901234567',
    },
    opener: { role: 'owner', name: 'Phạm Hữu Cường' },
    type: 'no_show',
    status: 'resolved',
    priority: 'low',
    subject: 'Khách không đến nhận phòng, không huỷ — yêu cầu giữ cọc',
    description:
      'Khách đã cọc 1.200.000đ. Ngày check-in không tới, không liên lạc. Theo policy huỷ <48h, tôi giữ 100% cọc.',
    amount: 1_200_000,
    evidence: [
      {
        id: 'ev-201',
        type: 'image',
        url: 'https://placehold.co/800x600?text=Anh+phong+trong+ngay+check-in',
        caption: 'Ảnh phòng trống tại 15:00 ngày check-in',
        uploadedBy: {
          id: 'owner-003',
          name: 'Phạm Hữu Cường',
          role: 'owner',
        },
        uploadedAt: '2026-04-15T18:00:00.000Z',
      },
    ],
    chatExcerpts: [
      {
        id: 'cx-201',
        messageId: 'msg-3001',
        content:
          'Anh ơi mai em check-in 14:00 nhé, đã chuẩn bị xong chưa ạ.',
        sender: { id: 'cus-003', name: 'Nguyễn Văn Z', role: 'customer' },
        sentAt: '2026-04-14T20:00:00.000Z',
      },
      {
        id: 'cx-202',
        messageId: 'msg-3002',
        content:
          'Sẵn sàng rồi anh ơi, em đến lúc nào báo anh để đón ạ.',
        sender: { id: 'owner-003', name: 'Phạm Hữu Cường', role: 'owner' },
        sentAt: '2026-04-14T20:05:00.000Z',
      },
      {
        id: 'cx-203',
        messageId: 'msg-3010',
        content:
          'Em ơi, 17:00 rồi mà chưa thấy đến. Gọi không bắt máy. Em có vấn đề gì không?',
        sender: { id: 'owner-003', name: 'Phạm Hữu Cường', role: 'owner' },
        sentAt: '2026-04-15T17:00:00.000Z',
      },
    ],
    verdict: 'favor_owner',
    penalty: {
      type: 'warn',
      target: 'customer',
      durationDays: null,
      refundAmount: 0,
    },
    resolution:
      'Khách không đến + không liên lạc. Theo policy huỷ <48h, chủ nhà giữ 100% cọc 1.200.000đ. Khách bị cảnh báo (warn) trong hệ thống.',
    createdAt: '2026-04-15T18:00:00.000Z',
    updatedAt: '2026-04-16T15:00:00.000Z',
    resolvedAt: '2026-04-16T15:00:00.000Z',
    resolvedBy: { id: 'dev-admin', name: 'Quản trị viên' },
  },
];

const store = new Map<string, Dispute>(SEED.map((d) => [d.id, d]));

export class MockDisputeRepository implements DisputeRepository {
  async list(filters?: DisputeFilters): Promise<Dispute[]> {
    let arr = Array.from(store.values());
    if (filters?.status) arr = arr.filter((d) => d.status === filters.status);
    if (filters?.type) arr = arr.filter((d) => d.type === filters.type);
    if (filters?.priority) {
      arr = arr.filter((d) => d.priority === filters.priority);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      arr = arr.filter(
        (d) =>
          d.id.toLowerCase().includes(q) ||
          d.bookingCode.toLowerCase().includes(q) ||
          d.subject.toLowerCase().includes(q) ||
          d.customer.name.toLowerCase().includes(q) ||
          d.owner.name.toLowerCase().includes(q),
      );
    }
    return arr.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getById(id: string): Promise<Dispute | null> {
    return store.get(id) ?? null;
  }

  async countActive(): Promise<number> {
    return Array.from(store.values()).filter(
      (d) => d.status === 'open' || d.status === 'investigating',
    ).length;
  }

  async open(input: OpenDisputeData): Promise<Dispute> {
    // Mock: tạo dispute placeholder. BE thật sẽ resolve customer/owner/property
    // từ bookingId. Ở đây chỉ giả lập.
    const id = `dis-${Date.now()}`;
    const now = new Date().toISOString();
    const dispute: Dispute = {
      id,
      bookingId: input.bookingId,
      bookingCode: input.bookingId.startsWith('mock-bk-')
        ? input.bookingId
            .replace('mock-bk-', 'HL-')
            .toUpperCase()
        : input.bookingId,
      propertyId: 'mock-prop-unknown',
      propertyName: 'Cơ sở (auto resolve từ BE)',
      customer: {
        id: 'auto',
        name: input.opener.role === 'customer' ? input.opener.name : 'Khách',
        email: 'auto@example.com',
        phone: null,
      },
      owner: {
        id: 'auto',
        name: input.opener.role === 'owner' ? input.opener.name : 'Chủ nhà',
        email: 'auto@example.com',
        phone: null,
      },
      opener: input.opener,
      type: input.type,
      status: 'open',
      priority: input.type === 'fraud' ? 'high' : 'medium',
      subject: input.subject,
      description: input.description,
      amount: input.amount ?? null,
      evidence: [],
      chatExcerpts: [],
      verdict: null,
      penalty: null,
      resolution: null,
      createdAt: now,
      updatedAt: now,
      resolvedAt: null,
      resolvedBy: null,
    };
    store.set(id, dispute);
    return dispute;
  }

  async startInvestigation(id: string): Promise<Dispute> {
    const d = store.get(id);
    if (!d) throw new NotFoundError('Không tìm thấy khiếu nại');
    const updated: Dispute = {
      ...d,
      status: 'investigating',
      updatedAt: new Date().toISOString(),
    };
    store.set(id, updated);
    return updated;
  }

  async resolve(input: ResolveDisputeInput): Promise<Dispute> {
    const d = store.get(input.disputeId);
    if (!d) throw new NotFoundError('Không tìm thấy khiếu nại');
    const now = new Date().toISOString();
    const updated: Dispute = {
      ...d,
      status: 'resolved',
      verdict: input.verdict,
      penalty: {
        type: input.penalty.type,
        target: input.penalty.target,
        durationDays: input.penalty.durationDays ?? null,
        refundAmount: input.penalty.refundAmount ?? null,
      },
      resolution: input.resolution,
      resolvedAt: now,
      resolvedBy: { id: 'dev-admin', name: 'Quản trị viên' },
      updatedAt: now,
    };
    store.set(input.disputeId, updated);
    return updated;
  }

  async reject(input: RejectDisputeInput): Promise<Dispute> {
    const d = store.get(input.disputeId);
    if (!d) throw new NotFoundError('Không tìm thấy khiếu nại');
    const now = new Date().toISOString();
    const updated: Dispute = {
      ...d,
      status: 'rejected',
      resolution: input.reason,
      resolvedAt: now,
      resolvedBy: { id: 'dev-admin', name: 'Quản trị viên' },
      updatedAt: now,
    };
    store.set(input.disputeId, updated);
    return updated;
  }
}
