'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getProfileUseCase } from '@/application/auth/get-profile';
import { loginUseCase } from '@/application/auth/login';
import { logoutUseCase } from '@/application/auth/logout';
import { ValidationError } from '@/core/errors';
import { RoleCode } from '@/core/value-objects/role';
import { authRepository } from '@/infrastructure/container';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { clearTokens, writeTokens } from '@/infrastructure/http/token-storage';

/**
 * Sanitize redirect target. Chỉ cho phép path nội bộ (`/...`) để chặn
 * open-redirect attack (`https://evil.com`, `//evil.com`, `/\\evil.com`).
 */
function sanitizeRedirect(raw: unknown): string {
  if (typeof raw !== 'string') return '/';
  if (!raw.startsWith('/')) return '/';
  if (raw.startsWith('//')) return '/';
  if (raw.startsWith('/\\')) return '/';
  return raw;
}

export interface ActionResult {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

function flattenFieldErrors(
  fe?: Record<string, string[]>,
): Record<string, string> | undefined {
  if (!fe) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fe)) if (v[0]) out[k] = v[0];
  return Object.keys(out).length ? out : undefined;
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirect') ?? '/');

  const values = { email };

  let session;
  try {
    session = await loginUseCase(authRepository(), { email, password });
  } catch (raw) {
    const err = raw instanceof ValidationError ? raw : mapApiErrorToDomain(raw);
    if (err instanceof ValidationError) {
      return {
        error: err.message,
        fieldErrors: flattenFieldErrors(err.fieldErrors),
        values,
      };
    }
    return { error: err.message, values };
  }

  await writeTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });

  if (session.user.role === RoleCode.CUSTOMER) {
    await clearTokens();
    return {
      error: 'Tài khoản này không được phép truy cập trang quản lý',
      values,
    };
  }

  revalidatePath('/', 'layout');

  const destination =
    redirectTo !== '/'
      ? sanitizeRedirect(redirectTo)
      : session.user.role === RoleCode.ADMIN
        ? '/admin'
        : '/host';
  redirect(destination);
}

const SignupSchema = z.object({
  name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  phone: z
    .string()
    .regex(/^0\d{9,10}$/, 'Số điện thoại 10-11 số bắt đầu bằng 0')
    .optional()
    .or(z.literal('')),
  role: z.enum(['owner', 'sale']).default('owner'),
});

export async function signupAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const rawRole = String(formData.get('role') ?? '');
  const schemaRole = rawRole === 'sale' ? 'sale' : 'owner';

  const nameVal = String(formData.get('name') ?? formData.get('full_name') ?? '');
  const emailVal = String(formData.get('email') ?? '');
  const phoneVal = String(formData.get('phone') ?? '');
  const values = { full_name: nameVal, email: emailVal, phone: phoneVal };

  const parsed = SignupSchema.safeParse({
    name: nameVal,
    email: emailVal,
    password: formData.get('password'),
    phone: phoneVal || undefined,
    role: schemaRole,
  });
  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors), values };
  }

  const repo = authRepository();
  let session;
  try {
    session = await repo.register({
      name: parsed.data.name,
      email: parsed.data.email,
      password: parsed.data.password,
      phone: parsed.data.phone || undefined,
      role: parsed.data.role === 'owner' ? RoleCode.OWNER : RoleCode.SALE,
    });
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    return { error: err.message, values };
  }

  await writeTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });

  revalidatePath('/', 'layout');
  redirect(parsed.data.role === 'owner' ? '/host' : '/');
}

export async function forgotPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const identifier = String(formData.get('email') ?? formData.get('identifier') ?? '');
  if (!identifier) {
    return { fieldErrors: { email: 'Vui lòng nhập email hoặc số điện thoại' } };
  }

  try {
    await authRepository().forgotPassword(identifier);
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    if (err.code === 'NETWORK' || err.code === 'UNKNOWN') {
      console.error('[forgotPassword] backend unreachable', err);
      return { ok: true };
    }
    return { error: err.message };
  }
  return { ok: true };
}

const ResetPasswordSchema = z.object({
  token: z.string().min(8, 'Token không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export async function resetPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = ResetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  try {
    await authRepository().resetPassword(parsed.data.token, parsed.data.password);
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    return { error: err.message };
  }
  redirect('/login?reset=1');
}

export async function logoutAction(): Promise<void> {
  try {
    await logoutUseCase(authRepository());
  } catch {
    // BE có thể đang down, vẫn xoá cookie phía mình.
  } finally {
    await clearTokens();
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getCurrentProfile() {
  try {
    return await getProfileUseCase(authRepository());
  } catch {
    return null;
  }
}

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Mật khẩu hiện tại tối thiểu 6 ký tự'),
  newPassword: z.string().min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
});

export async function changePasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = ChangePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  });
  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  try {
    await authRepository().changePassword(parsed.data);
    return { ok: true };
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    return { error: err.message };
  }
}
