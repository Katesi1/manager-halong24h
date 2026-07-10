'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { RoleCode } from '@/core/value-objects/role';
import type { AuthTokens } from '@/core/entities/user';
import type { StaffInviteVerification } from '@/application/ports/staff-repository';
import { authRepository, staffRepository } from '@/infrastructure/container';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { clearTokens, writeTokens } from '@/infrastructure/http/token-storage';

import type { ActionResult } from './auth';

/**
 * Luồng "Nhân viên (SALE) nhận lời mời" — spec §11.2.
 *
 * Public (không cần đăng nhập). Nhân viên nhập mã mời (short code `HL-XXXXXX`
 * gõ tay hoặc full token 64-hex từ link email) → verify → tạo tài khoản SALE
 * bằng Google HOẶC email/password → tự đăng nhập.
 */

/** Full token 64-hex giữ nguyên; short code `HL-…` chuẩn hoá về hoa. */
function normalizeToken(raw: unknown): string {
  const t = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '');
  return /^hl-/i.test(t) ? t.toUpperCase() : t;
}

function flattenFieldErrors(
  fe?: Record<string, string[]>,
): Record<string, string> | undefined {
  if (!fe) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fe)) if (v[0]) out[k] = v[0];
  return Object.keys(out).length ? out : undefined;
}

function inviteStatusMessage(status: StaffInviteVerification['status']): string {
  switch (status) {
    case 'accepted':
      return 'Lời mời này đã được sử dụng. Vui lòng đăng nhập bằng tài khoản của bạn.';
    case 'expired':
      return 'Lời mời đã hết hạn. Liên hệ chủ nhà để được mời lại.';
    case 'cancelled':
      return 'Lời mời đã bị huỷ. Liên hệ chủ nhà để được mời lại.';
    default:
      return 'Lời mời không hợp lệ.';
  }
}

export type VerifyInviteResult =
  | { ok: true; token: string; data: StaffInviteVerification }
  | { ok: false; error: string };

/** Verify mã mời để render trang accept (không cấp token). */
export async function verifyStaffInviteAction(
  rawToken: string,
): Promise<VerifyInviteResult> {
  const token = normalizeToken(rawToken);
  if (!token) return { ok: false, error: 'Vui lòng nhập mã mời' };

  try {
    const data = await staffRepository().verifyInvite(token);
    if (data.status !== 'pending') {
      return { ok: false, error: inviteStatusMessage(data.status) };
    }
    return { ok: true, token, data };
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    return { ok: false, error: err.message };
  }
}

/** Ghi token + fetch profile để biết role → redirect đích. */
async function finishAccept(
  tokens: AuthTokens,
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  await writeTokens(tokens);
  let profile;
  try {
    profile = await authRepository().getProfile();
  } catch {
    await clearTokens();
    return {
      ok: false,
      error: 'Không lấy được thông tin tài khoản sau khi tham gia. Vui lòng đăng nhập lại.',
    };
  }
  revalidatePath('/', 'layout');
  // Accept invite luôn tạo SALE (khu (host)); giữ nhánh admin cho chắc.
  const redirectTo = profile.role === RoleCode.ADMIN ? '/admin' : '/host';
  return { ok: true, redirectTo };
}

const AcceptPasswordSchema = z.object({
  token: z.string().min(6, 'Thiếu mã mời'),
  name: z.string().min(2, 'Họ tên tối thiểu 2 ký tự'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  phone: z
    .string()
    .regex(/^0\d{9,10}$/, 'Số điện thoại 10-11 số bắt đầu bằng 0')
    .optional()
    .or(z.literal('')),
});

/** Accept bằng email/password (form useActionState). */
export async function acceptInviteWithPasswordAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const nameVal = String(formData.get('name') ?? '');
  const phoneVal = String(formData.get('phone') ?? '');
  const values = { name: nameVal, phone: phoneVal };

  const parsed = AcceptPasswordSchema.safeParse({
    token: normalizeToken(formData.get('token')),
    name: nameVal,
    password: formData.get('password'),
    phone: phoneVal || undefined,
  });
  if (!parsed.success) {
    return {
      fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors),
      values,
    };
  }

  let tokens: AuthTokens;
  try {
    tokens = await staffRepository().acceptInvite({
      token: parsed.data.token,
      method: 'password',
      name: parsed.data.name,
      password: parsed.data.password,
      phone: parsed.data.phone || undefined,
    });
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    return { error: err.message, values };
  }

  const res = await finishAccept(tokens);
  if (!res.ok) return { error: res.error, values };
  redirect(res.redirectTo);
}

/** Accept bằng Google (idToken JWT từ GIS). */
export async function acceptInviteWithGoogleAction(
  rawToken: string,
  idToken: string,
): Promise<{ ok: true; redirectTo: string } | { ok: false; error: string }> {
  const token = normalizeToken(rawToken);
  if (!token) return { ok: false, error: 'Thiếu mã mời' };
  if (!idToken || typeof idToken !== 'string') {
    return { ok: false, error: 'Thiếu Google idToken' };
  }

  let tokens: AuthTokens;
  try {
    tokens = await staffRepository().acceptInvite({
      token,
      method: 'google',
      idToken,
    });
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    return { ok: false, error: err.message };
  }

  return finishAccept(tokens);
}
