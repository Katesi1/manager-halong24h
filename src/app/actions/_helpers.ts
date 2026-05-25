import 'server-only';

import {
  DomainError,
  ValidationError,
} from '@/core/errors';
import { fail, ok, type Result } from '@/lib/result';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';

/**
 * Wrap một use case thành Result<T> không throw — để Server Action trả thẳng cho client.
 *
 * Quy tắc map error:
 *   ValidationError -> { ok: false, error, fieldErrors }
 *   Mọi DomainError khác (kể cả UnauthorizedError) -> fail(message)
 *
 * Note: 401 cũng convert thành fail() để UI render empty state thay vì 500.
 */
export async function toResult<T>(
  fn: () => Promise<T>,
): Promise<Result<T, string>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (raw) {
    const err: DomainError =
      raw instanceof DomainError ? raw : mapApiErrorToDomain(raw);

    if (err instanceof ValidationError) {
      return fail(err.message, err.fieldErrors);
    }
    return fail(err.message || 'Lỗi không xác định');
  }
}
