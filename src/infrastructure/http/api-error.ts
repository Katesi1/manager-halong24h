import {
  ConflictError,
  DomainError,
  ForbiddenError,
  NetworkError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@/core/errors';

export interface ApiErrorPayload {
  success: false;
  statusCode: number;
  message: string;
  errors?: unknown;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly payload: ApiErrorPayload | null;

  constructor(status: number, message: string, payload: ApiErrorPayload | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Map message kỹ thuật từ BE thành tiếng Việt thân thiện.
 * Khi BE thay đổi message, chỉ cần thêm pattern ở đây.
 */
function humanize(message: string): string {
  if (!message) return 'Đã có lỗi xảy ra';
  const lower = message.toLowerCase();
  if (lower.includes('failed to generate payment url')) {
    return 'Hệ thống thanh toán đang tạm gián đoạn. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
  }
  if (lower.startsWith('validation failed:')) {
    return message.slice('validation failed:'.length).trim() || 'Dữ liệu không hợp lệ';
  }
  if (lower === 'invalid token') return 'Phiên đăng nhập hết hạn, vui lòng đăng nhập lại';
  if (lower === 'invalid google token') return 'Token Google không hợp lệ';
  if (lower === 'invalid reset token') return 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn';
  if (lower.includes('phone number is already registered'))
    return 'Số điện thoại đã được đăng ký';
  if (lower.includes('email is already registered'))
    return 'Email đã được đăng ký';
  if (lower.includes('phone number or password is incorrect'))
    return 'Email/SĐT hoặc mật khẩu không chính xác';
  if (lower.includes('you do not have permission'))
    return 'Bạn không có quyền thực hiện thao tác này';
  return message;
}

export function mapApiErrorToDomain(err: unknown): DomainError {
  if (err instanceof DomainError) return err;
  if (err instanceof ApiError) {
    const fieldErrors = extractFieldErrors(err.payload?.errors);
    const friendly = humanize(err.message);
    switch (err.status) {
      case 400:
        return new ValidationError(friendly, fieldErrors);
      case 401:
        return new UnauthorizedError(friendly);
      case 403:
        return new ForbiddenError(friendly);
      case 404:
        return new NotFoundError(friendly);
      case 409:
        return new ConflictError(friendly);
      default:
        return new DomainError(`API_${err.status}`, friendly);
    }
  }
  if (err instanceof DOMException && err.name === 'AbortError') {
    return new NetworkError('Máy chủ phản hồi quá chậm. Vui lòng thử lại.');
  }
  if (err instanceof TypeError) {
    return new NetworkError('Không thể kết nối tới máy chủ. Vui lòng thử lại sau.');
  }
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return new NetworkError('Máy chủ phản hồi quá chậm. Vui lòng thử lại.');
    }
    return new DomainError('UNKNOWN', err.message);
  }
  return new DomainError('UNKNOWN', 'Đã có lỗi xảy ra');
}

function extractFieldErrors(
  errors: unknown,
): Record<string, string[]> | undefined {
  if (!errors || typeof errors !== 'object') return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(errors as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      out[k] = v.map(String);
    } else if (typeof v === 'string') {
      out[k] = [v];
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
