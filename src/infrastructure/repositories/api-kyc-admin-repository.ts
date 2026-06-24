import 'server-only';

import {
  KYC_FIELD_LABEL,
  type ApproveKycInput,
  type KycAdminDetail,
  type KycAdminFilters,
  type KycAdminListResult,
  type KycAdminSubmission,
  type KycField,
  type KycPayment,
  type KycQueueFilter,
  type KycUploadDetail,
  type KycUploadSet,
  type KycVerification,
  type KycVerificationField,
  type RejectKycInput,
} from '@/core/entities/kyc-admin';
import type { KycSubmissionStatus } from '@/core/entities/kyc';
import type { KycAdminRepository } from '@/application/ports/kyc-admin-repository';

import { apiClient } from '../http/api-client';

/**
 * Admin KYC.
 *
 * Danh sách: `GET /admin/kyc/queue?filter&q&page&pageSize` →
 *   `{ filter, pendingCount, items[], total, page, pageSize }`.
 * Chi tiết (legacy 5-field): `GET /kyc/submissions/:id` (ADMIN mọi hồ sơ, OWNER của mình).
 * Chi tiết đầy đủ: `GET /admin/kyc/:id` (Auth ADMIN) → trả 3 ảnh upload (kèm
 *   ocrResult/ocrConfidence/faceMatchScore/livenessScore/provider), checklist 7
 *   yếu tố xác minh tự động (`verificationFields[]` + passed/total count) và danh
 *   sách thanh toán `payments[]`. Dùng cho trang chi tiết `/admin/kyc/:id`.
 *
 * Status BE rút gọn còn `pending | approved | rejected` → map sang entity 8-state.
 * `uploads` là object `{ cccdFront, cccdBack, selfie }`, mỗi cái có `imageUrl`,
 * `confidence`, `faceMatchScore`, `ocrResult`. `rejectedItems` liệt kê ảnh bị từ
 * chối → đánh dấu field verification = `mismatched`.
 *
 * Cả queue lẫn detail đều trả nested `user: { id, name, phone, email }` (+ `userId`
 * phẳng ở detail) → thông tin chủ nhà có sẵn, không cần fetch `/users/:id`.
 */

/** 1 ảnh upload — queue & detail dùng chung shape (detail thêm thumb/uploadedAt). */
interface SpecUpload {
  id?: string;
  imageUrl?: string | null;
  imageUrlThumb?: string | null;
  ocrResult?: unknown;
  confidence?: number | null;
  faceMatchScore?: number | null;
  uploadedAt?: string | null;
}

interface SpecKycUploads {
  cccdFront?: SpecUpload | null;
  cccdBack?: SpecUpload | null;
  selfie?: SpecUpload | null;
}

interface SpecKycUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
}

interface SpecKycPayment {
  id?: string;
  planId?: string | null;
  cycle?: string | null;
  rooms?: number | null;
  totalAmount?: number | null;
  method?: string | null;
  status?: string | null;
  paidAt?: string | null;
}

interface SpecKycSubmission {
  id: string;
  status: string;
  statusFilter?: number;
  user?: SpecKycUser;
  /** Fallback nếu BE trả phẳng. */
  userId?: string;
  rejectReason?: string | null;
  rejectedItems?: string[];
  approvedAt?: string | null;
  trialEndsAt?: string | null;
  chargeStartsAt?: string | null;
  expectedRooms?: number | null;
  plan?: string | null;
  totalPaid?: number | null;
  uploads?: SpecKycUploads;
  payment?: SpecKycPayment | null;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface SpecQueueResponse {
  filter: KycQueueFilter;
  pendingCount: number;
  total: number;
  page: number;
  pageSize: number;
  items: SpecKycSubmission[];
}

/** 1 ảnh upload đầy đủ ở `GET /admin/kyc/:id`. */
interface SpecUploadDetail {
  id?: string;
  imageUrl?: string | null;
  imageUrlThumb?: string | null;
  ocrResult?: unknown;
  ocrConfidence?: number | null;
  faceMatchScore?: number | null;
  livenessScore?: number | null;
  provider?: string | null;
  uploadedAt?: string | null;
}

interface SpecVerificationField {
  key?: string;
  label?: string;
  passed?: boolean;
  source?: string | null;
}

interface SpecKycDetailUser {
  id?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  avatar?: string | null;
  role?: number | null;
  kycBypass?: boolean;
  kycStatus?: string | null;
  createdAt?: string | null;
}

interface SpecKycDetail {
  id: string;
  userId?: string;
  user?: SpecKycDetailUser;
  status: string;
  statusLabel?: string | null;
  rejectReason?: string | null;
  rejectedItems?: string[];
  approvedAt?: string | null;
  approvedById?: string | null;
  trialEndsAt?: string | null;
  chargeStartsAt?: string | null;
  expectedRooms?: number | null;
  uploads?: {
    cccdFront?: SpecUploadDetail | null;
    cccdBack?: SpecUploadDetail | null;
    selfie?: SpecUploadDetail | null;
  };
  payments?: SpecKycPayment[];
  verificationFields?: SpecVerificationField[];
  verificationPassedCount?: number;
  verificationTotalCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/** Map status BE (rút gọn) sang entity 8-state; nhận cả camelCase legacy. */
function mapStatus(s: string): KycSubmissionStatus {
  switch (s) {
    case 'pending':
    case 'awaitingApproval':
      return 'awaiting_approval';
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'kycSubmitted':
      return 'kyc_submitted';
    case 'paymentPending':
      return 'payment_pending';
    case 'paid':
      return 'paid';
    case 'refunded':
      return 'refunded';
    case 'draft':
      return 'draft';
    default:
      return 'awaiting_approval';
  }
}

/** Map key upload BE → key field entity. */
const UPLOAD_FIELD: Record<
  keyof SpecKycUploads,
  Extract<KycField['key'], 'cccd_front' | 'cccd_back' | 'selfie'>
> = {
  cccdFront: 'cccd_front',
  cccdBack: 'cccd_back',
  selfie: 'selfie',
};

/** Điểm số BE có thể là 0–1 hoặc 0–100 — quy về phần trăm để hiển thị. */
function toPercent(v: number): string {
  const n = v <= 1 ? v * 100 : v;
  return `${Math.round(n)}%`;
}

function uploadNote(up: SpecUpload): string | null {
  const parts: string[] = [];
  if (typeof up.confidence === 'number')
    parts.push(`OCR ${toPercent(up.confidence)}`);
  if (typeof up.faceMatchScore === 'number')
    parts.push(`Khớp mặt ${toPercent(up.faceMatchScore)}`);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * Dựng checklist 5 yếu tố: 3 ảnh (CCCD trước/sau, selfie) lấy `imageUrl` thật từ
 * `uploads`; SĐT + email lấy từ thông tin chủ nhà. Verification: ảnh nằm trong
 * `rejectedItems` → `mismatched`; hồ sơ đã approved → `matched`; còn lại `pending`.
 */
function buildFields(
  s: SpecKycSubmission,
  owner: { email: string; phone: string },
): KycField[] {
  const u = s.uploads ?? {};
  const rejected = new Set(s.rejectedItems ?? []);
  const approved = s.status === 'approved';

  const verifFor = (uploadKey: string): KycVerification => {
    if (rejected.has(uploadKey)) return 'mismatched';
    if (approved) return 'matched';
    return 'pending';
  };

  const imageField = (uploadKey: keyof SpecKycUploads): KycField => {
    const fieldKey = UPLOAD_FIELD[uploadKey];
    const up = u[uploadKey] ?? null;
    return {
      key: fieldKey,
      label: KYC_FIELD_LABEL[fieldKey],
      value: typeof up?.imageUrl === 'string' ? up.imageUrl : null,
      verification: verifFor(uploadKey),
      note: up ? uploadNote(up) : null,
    };
  };

  const textField = (key: 'phone' | 'email', value: string): KycField => ({
    key,
    label: KYC_FIELD_LABEL[key],
    value: value || null,
    verification: approved ? 'matched' : 'pending',
    note: null,
  });

  return [
    imageField('cccdFront'),
    imageField('cccdBack'),
    imageField('selfie'),
    textField('phone', owner.phone),
    textField('email', owner.email),
  ];
}

function mapPayment(p: SpecKycPayment | null | undefined): KycPayment | null {
  if (!p) return null;
  return {
    planId: p.planId ?? null,
    cycle: p.cycle ?? null,
    rooms: p.rooms ?? null,
    totalAmount: p.totalAmount ?? null,
    method: p.method ?? null,
    status: p.status ?? null,
    paidAt: p.paidAt ?? null,
  };
}

function mapSubmission(s: SpecKycSubmission): KycAdminSubmission {
  const now = s.updatedAt ?? s.createdAt;
  const ownerEmail = s.user?.email ?? '';
  const ownerPhone = s.user?.phone ?? '';
  return {
    id: s.id,
    ownerId: s.user?.id ?? s.userId ?? '',
    ownerName: s.user?.name ?? '',
    ownerEmail,
    ownerPhone,
    status: mapStatus(s.status),
    fields: buildFields(s, { email: ownerEmail, phone: ownerPhone }),
    rejectedReason: s.rejectReason ?? null,
    rejectedItems: s.rejectedItems ?? [],
    rejectedAt: null,
    approvedAt: s.approvedAt ?? null,
    expectedRooms: s.expectedRooms ?? null,
    payment: mapPayment(s.payment),
    submittedAt: s.submittedAt ?? s.createdAt,
    createdAt: s.createdAt,
    updatedAt: now,
  };
}

function mapUploadDetail(
  up: SpecUploadDetail | null | undefined,
): KycUploadDetail | null {
  if (!up) return null;
  return {
    id: up.id ?? '',
    imageUrl: up.imageUrl ?? null,
    imageUrlThumb: up.imageUrlThumb ?? null,
    ocrResult: up.ocrResult ?? null,
    ocrConfidence: typeof up.ocrConfidence === 'number' ? up.ocrConfidence : null,
    faceMatchScore:
      typeof up.faceMatchScore === 'number' ? up.faceMatchScore : null,
    livenessScore:
      typeof up.livenessScore === 'number' ? up.livenessScore : null,
    provider: up.provider ?? null,
    uploadedAt: up.uploadedAt ?? null,
  };
}

function mapUploadSet(u: SpecKycDetail['uploads']): KycUploadSet {
  return {
    cccdFront: mapUploadDetail(u?.cccdFront),
    cccdBack: mapUploadDetail(u?.cccdBack),
    selfie: mapUploadDetail(u?.selfie),
  };
}

function mapVerificationField(
  f: SpecVerificationField,
): KycVerificationField {
  return {
    key: f.key ?? '',
    label: f.label ?? f.key ?? '',
    passed: f.passed === true,
    source: f.source ?? null,
  };
}

/** Map `kycStatus` của user — chấp nhận cả `'none'` (chưa nộp). */
function mapUserKycStatus(s: string | null | undefined): KycSubmissionStatus | 'none' {
  if (!s || s === 'none') return 'none';
  return mapStatus(s);
}

function mapDetail(d: SpecKycDetail): KycAdminDetail {
  const fields = (d.verificationFields ?? []).map(mapVerificationField);
  const passed = fields.filter((f) => f.passed).length;
  return {
    id: d.id,
    userId: d.user?.id ?? d.userId ?? '',
    user: {
      id: d.user?.id ?? d.userId ?? '',
      name: d.user?.name ?? '',
      email: d.user?.email ?? '',
      phone: d.user?.phone ?? null,
      avatar: d.user?.avatar ?? null,
      role: typeof d.user?.role === 'number' ? d.user.role : null,
      kycBypass: d.user?.kycBypass === true,
      kycStatus: mapUserKycStatus(d.user?.kycStatus),
      createdAt: d.user?.createdAt ?? null,
    },
    status: mapStatus(d.status),
    statusLabel: d.statusLabel ?? null,
    rejectReason: d.rejectReason ?? null,
    rejectedItems: d.rejectedItems ?? [],
    approvedAt: d.approvedAt ?? null,
    approvedById: d.approvedById ?? null,
    trialEndsAt: d.trialEndsAt ?? null,
    chargeStartsAt: d.chargeStartsAt ?? null,
    expectedRooms: typeof d.expectedRooms === 'number' ? d.expectedRooms : null,
    uploads: mapUploadSet(d.uploads),
    payments: (d.payments ?? []).map(mapPaymentDetail),
    verificationFields: fields,
    verificationPassedCount:
      typeof d.verificationPassedCount === 'number'
        ? d.verificationPassedCount
        : passed,
    verificationTotalCount:
      typeof d.verificationTotalCount === 'number'
        ? d.verificationTotalCount
        : fields.length,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt ?? d.createdAt,
  };
}

/** Payment trong list `payments[]` luôn có giá trị (khác `mapPayment` nullable). */
function mapPaymentDetail(p: SpecKycPayment): KycPayment {
  return {
    id: p.id ?? undefined,
    planId: p.planId ?? null,
    cycle: p.cycle ?? null,
    rooms: p.rooms ?? null,
    totalAmount: p.totalAmount ?? null,
    method: p.method ?? null,
    status: p.status ?? null,
    paidAt: p.paidAt ?? null,
  };
}

/** Trả `true` nếu lỗi là HTTP 404 (không tìm thấy hồ sơ). */
function isNotFound(err: unknown): boolean {
  return (
    err instanceof Error &&
    'status' in err &&
    (err as { status: number }).status === 404
  );
}

export class ApiKycAdminRepository implements KycAdminRepository {
  async list(filters?: KycAdminFilters): Promise<KycAdminListResult> {
    const filter: KycQueueFilter = filters?.filter ?? 1;
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;
    const data = await apiClient.get<SpecQueueResponse>('/admin/kyc/queue', {
      query: {
        filter,
        page,
        pageSize,
        q: filters?.search,
      },
      cache: 'no-store',
    });
    return {
      filter: data.filter ?? filter,
      pendingCount: data.pendingCount ?? 0,
      total: data.total ?? data.items.length,
      page: data.page ?? page,
      pageSize: data.pageSize ?? pageSize,
      items: data.items.map(mapSubmission),
    };
  }

  async getById(id: string): Promise<KycAdminSubmission | null> {
    let data: SpecKycSubmission;
    try {
      data = await apiClient.get<SpecKycSubmission>(`/kyc/submissions/${id}`, {
        cache: 'no-store',
      });
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }

    return mapSubmission(data);
  }

  async getDetail(id: string): Promise<KycAdminDetail | null> {
    let data: SpecKycDetail;
    try {
      data = await apiClient.get<SpecKycDetail>(`/admin/kyc/${id}`, {
        cache: 'no-store',
      });
    } catch (err) {
      if (isNotFound(err)) return null;
      throw err;
    }
    return mapDetail(data);
  }

  async approve(input: ApproveKycInput): Promise<KycAdminSubmission> {
    const data = await apiClient.post<SpecKycSubmission>(
      `/admin/kyc/submissions/${input.submissionId}/approve`,
      // trialDays mặc định 7 do BE quyết định
    );
    return mapSubmission(data);
  }

  async reject(input: RejectKycInput): Promise<KycAdminSubmission> {
    const data = await apiClient.post<SpecKycSubmission>(
      `/admin/kyc/submissions/${input.submissionId}/reject`,
      { reason: input.reason },
    );
    return mapSubmission(data);
  }

  /**
   * Spec v1.11: ưu tiên `pendingCount` từ `list()`. Endpoint cũ vẫn chạy
   * (deprecated) — dùng làm fallback khi caller chưa migrate. Để tránh
   * gọi 2 round trip, gọi list với pageSize=1 filter=1.
   */
  async countPending(): Promise<number> {
    const result = await this.list({ filter: 1, page: 1, pageSize: 1 });
    return result.pendingCount;
  }
}
