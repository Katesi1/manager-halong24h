import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type { AuthSession } from '@/core/entities/user';
import type { AuthRepository } from '../ports/auth-repository';

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export async function loginUseCase(
  repo: AuthRepository,
  raw: unknown,
): Promise<AuthSession> {
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Vui lòng kiểm tra lại thông tin đăng nhập',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.login(parsed.data);
}
