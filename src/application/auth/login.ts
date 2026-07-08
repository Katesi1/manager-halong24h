import { z } from 'zod';

import { ValidationError } from '@/core/errors';
import type { AuthTokens } from '@/core/entities/user';
import type { AuthRepository } from '../ports/auth-repository';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^0\d{9,10}$/;

export const LoginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email hoặc số điện thoại')
    .refine((v) => EMAIL_RE.test(v) || PHONE_RE.test(v.replace(/[\s.-]/g, '')), {
      message: 'Email hoặc số điện thoại không hợp lệ',
    })
    .transform((v) => (EMAIL_RE.test(v) ? v : v.replace(/[\s.-]/g, ''))),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export async function loginUseCase(
  repo: AuthRepository,
  raw: unknown,
): Promise<AuthTokens> {
  const parsed = LoginSchema.safeParse(raw);
  if (!parsed.success) {
    throw new ValidationError(
      'Vui lòng kiểm tra lại thông tin đăng nhập',
      parsed.error.flatten().fieldErrors,
    );
  }
  return repo.login(parsed.data);
}
