export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  readonly fieldErrors?: Record<string, string[]>;
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super('VALIDATION', message);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Phiên đăng nhập đã hết hạn') {
    super('UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Bạn không có quyền thực hiện thao tác này') {
    super('FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Không tìm thấy tài nguyên') {
    super('NOT_FOUND', message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Dữ liệu xung đột') {
    super('CONFLICT', message);
    this.name = 'ConflictError';
  }
}

export class NetworkError extends DomainError {
  constructor(message = 'Lỗi kết nối tới máy chủ') {
    super('NETWORK', message);
    this.name = 'NetworkError';
  }
}

/**
 * User đã có phiên thanh toán đang chờ (BE trả 409 `paymentPending`) — spec §10.2.
 * Khác các 409 khác (frozen/downgrade/markPaidDuplicate): chỉ lỗi này mới nên
 * fallback hiển thị lại phiên đang chờ thay vì báo lỗi.
 */
export class PaymentPendingError extends DomainError {
  constructor(message = 'Bạn đang có phiên thanh toán chờ xác nhận') {
    super('PAYMENT_PENDING', message);
    this.name = 'PaymentPendingError';
  }
}
