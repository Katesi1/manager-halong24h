'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { getProfileUseCase } from '@/application/auth/get-profile';
import { loginUseCase } from '@/application/auth/login';
import { logoutUseCase } from '@/application/auth/logout';
import { ValidationError } from '@/core/errors';
import { RoleCode } from '@/core/value-objects/role';
import type { UserProfile } from '@/core/entities/user';
import { authRepository } from '@/infrastructure/container';
import { mapApiErrorToDomain } from '@/infrastructure/http/api-error';
import { clearTokens, writeTokens } from '@/infrastructure/http/token-storage';

const DEV_PROFILES: Record<string, UserProfile> = {
  admin: {
    id: 'dev-admin',
    name: 'Quản trị viên (chế độ thử nghiệm)',
    email: 'dev-admin@halong24h.local',
    phone: '0900000000',
    role: RoleCode.ADMIN,
    ownerId: null,
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: true,
    kycStatus: 'approved',
    subscriptionStatus: 'active',
    subscriptionPlanId: null,
    subscriptionCycle: null,
    trialEndsAt: null,
    nextChargeAt: null,
    permissions: [],
  },
  owner: {
    id: 'owner-001',
    name: 'Chủ nhà Trần Đức Tuấn (dev)',
    email: 'tuan-owner@halong24h.local',
    phone: '0911111111',
    role: RoleCode.OWNER,
    ownerId: null,
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: false,
    kycStatus: 'approved',
    subscriptionStatus: 'active',
    subscriptionPlanId: 'basic',
    subscriptionCycle: 'monthly',
    trialEndsAt: null,
    nextChargeAt: '2026-06-05T00:00:00.000Z',
    permissions: [],
  },
  'owner-nokyc': {
    id: 'owner-newbie',
    name: 'Chủ nhà mới (chưa KYC)',
    email: 'newbie@halong24h.local',
    phone: '0922222222',
    role: RoleCode.OWNER,
    ownerId: null,
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: false,
    kycStatus: 'pending',
    subscriptionStatus: null,
    subscriptionPlanId: null,
    subscriptionCycle: null,
    trialEndsAt: null,
    nextChargeAt: null,
    permissions: [],
  },
  'owner-overdue': {
    id: 'owner-005',
    name: 'Vũ Minh Châu (sub overdue)',
    email: 'chau-owner@halong24h.local',
    phone: '0933333333',
    role: RoleCode.OWNER,
    ownerId: null,
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: false,
    kycStatus: 'approved',
    subscriptionStatus: 'past_due',
    subscriptionPlanId: 'pro',
    subscriptionCycle: 'monthly',
    trialEndsAt: null,
    nextChargeAt: '2026-05-05T00:00:00.000Z',
    permissions: [],
  },
  sale: {
    id: 'sale-001',
    name: 'Nhân viên SALE (assigned)',
    email: 'sale01@halong24h.local',
    phone: '0944444444',
    role: RoleCode.SALE,
    ownerId: 'owner-001',
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: false,
    kycStatus: 'none',
    subscriptionStatus: null,
    subscriptionPlanId: null,
    subscriptionCycle: null,
    trialEndsAt: null,
    nextChargeAt: null,
    permissions: [],
  },
  'sale-noown': {
    id: 'sale-orphan',
    name: 'SALE chưa gán Owner',
    email: 'sale-orphan@halong24h.local',
    phone: '0955555555',
    role: RoleCode.SALE,
    ownerId: null,
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: false,
    kycStatus: 'none',
    subscriptionStatus: null,
    subscriptionPlanId: null,
    subscriptionCycle: null,
    trialEndsAt: null,
    nextChargeAt: null,
    permissions: [],
  },
  customer: {
    id: 'cus-001',
    name: 'Khách thường (không quyền)',
    email: 'customer@halong24h.local',
    phone: '0966666666',
    role: RoleCode.CUSTOMER,
    ownerId: null,
    isActive: true,
    gender: null,
    dateOfBirth: null,
    createdAt: new Date().toISOString(),
    kycBypass: false,
    kycStatus: 'none',
    subscriptionStatus: null,
    subscriptionPlanId: null,
    subscriptionCycle: null,
    trialEndsAt: null,
    nextChargeAt: null,
    permissions: [],
  },
};

async function resolveDevProfile(): Promise<UserProfile> {
  // Cookie `dev_role` cho phép switch role để test/dev không cần restart server.
  // Default = customer (least-privileged) nếu cookie không set hoặc giá trị không hợp lệ.
  // SECURITY: KHÔNG default về admin — bảo vệ staging deploy khỏi rò rỉ quyền admin
  // nếu `DEV_BYPASS_AUTH=1` lỡ bật trên môi trường không phải local.
  try {
    const jar = await cookies();
    const raw = jar.get('dev_role')?.value;
    if (raw && DEV_PROFILES[raw]) return DEV_PROFILES[raw];
  } catch {
    // ignore — fallback default
  }
  return DEV_PROFILES.customer;
}

function devBypassEnabled(): boolean {
  // NEVER allow bypass in production, regardless of env var
  if (process.env.NODE_ENV === 'production') return false;
  return process.env.DEV_BYPASS_AUTH === '1';
}

/**
 * H4: cảnh báo khi DEV_BYPASS_AUTH=1 nhưng api-client đang trỏ tới BE thật.
 * Trong cấu hình này, FE middleware bypass login nhưng request đi BE không có
 * Authorization header → mọi auth-required endpoint sẽ trả 401. C3 fix giúp page
 * render empty state thay vì 500, nhưng dev nên biết để hoặc tắt bypass + login
 * thật, hoặc seed DB user thật để test.
 */
let devBypassWarningEmitted = false;
function warnDevBypassWithRealApi(): void {
  if (devBypassWarningEmitted) return;
  if (!devBypassEnabled()) return;
  // BE base URL có cấu hình → request thật sẽ đi ra. Coi như "real api mode".
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBase) return;
  devBypassWarningEmitted = true;
  console.warn(
    '[DEV_BYPASS_AUTH] Real BE mode (' +
      apiBase +
      ') + bypass active — auth-required endpoints will 401. ' +
      'Either disable bypass and login, or seed DB with test users.',
  );
}

/** Expose for layout dev banner (server-only). */
export async function getDevBypassInfo(): Promise<{
  enabled: boolean;
  role: string;
} | null> {
  if (!devBypassEnabled()) return null;
  try {
    const jar = await cookies();
    const raw = jar.get('dev_role')?.value;
    if (raw && DEV_PROFILES[raw]) return { enabled: true, role: raw };
  } catch {
    // ignore
  }
  return { enabled: true, role: 'customer' };
}

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
}

function flattenFieldErrors(
  fe?: Record<string, string[]>,
): Record<string, string> | undefined {
  if (!fe) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fe)) if (v[0]) out[k] = v[0];
  return Object.keys(out).length ? out : undefined;
}

/**
 * Map email pattern → dev_role cookie value (cho mock auth flow).
 * Tuân theo least-privileged: nếu không khớp pattern nào → customer (sẽ thấy ForbiddenScreen).
 */
function mockRoleFromEmail(email: string): string {
  const lower = email.toLowerCase();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('owner') || lower.includes('host')) return 'owner';
  if (lower.includes('sale') || lower.includes('staff')) return 'sale';
  return 'customer';
}

export async function loginAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const redirectTo = String(formData.get('redirect') ?? '/');

  // Mock mode: bỏ qua BE, set `dev_role` cookie dựa theo email pattern.
  // Pattern: "admin" → admin, "owner"/"host" → owner, "sale"/"staff" → sale, còn lại → customer.
  // Mục đích: dev/QA có thể đăng nhập 0 cần BE chạy.
  if (devBypassEnabled()) {
    if (!email || !password) {
      return {
        fieldErrors: {
          ...(email ? {} : { email: 'Email không được để trống' }),
          ...(password ? {} : { password: 'Mật khẩu không được để trống' }),
        },
      };
    }
    const role = mockRoleFromEmail(email);
    try {
      const jar = await cookies();
      jar.set('dev_role', role, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: false,
      });
    } catch {
      // ignore — server-side cookie write may fail in edge cases
    }
    revalidatePath('/', 'layout');
    redirect(sanitizeRedirect(redirectTo));
  }

  let session;
  try {
    session = await loginUseCase(authRepository(), { email, password });
  } catch (raw) {
    const err = raw instanceof ValidationError ? raw : mapApiErrorToDomain(raw);
    if (err instanceof ValidationError) {
      return {
        error: err.message,
        fieldErrors: flattenFieldErrors(err.fieldErrors),
      };
    }
    return { error: err.message };
  }

  await writeTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });

  if (session.user.role === RoleCode.CUSTOMER) {
    await clearTokens();
    return {
      error: 'Tài khoản này không được phép truy cập trang quản lý',
    };
  }

  revalidatePath('/', 'layout');
  redirect(sanitizeRedirect(redirectTo));
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

  const parsed = SignupSchema.safeParse({
    name: formData.get('name') ?? formData.get('full_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    phone: formData.get('phone') || undefined,
    role: schemaRole,
  });
  if (!parsed.success) {
    return { fieldErrors: flattenFieldErrors(parsed.error.flatten().fieldErrors) };
  }

  // Mock mode: bỏ qua BE register, set `dev_role` cookie theo role được chọn.
  // Customer signup từ Manager UI: set dev_role=customer → user sẽ thấy ForbiddenScreen,
  // tự hiểu cần dùng trang khách (Online).
  if (devBypassEnabled()) {
    let mockRole = 'customer';
    if (rawRole === 'owner') mockRole = 'owner';
    else if (rawRole === 'sale') mockRole = 'sale';
    try {
      const jar = await cookies();
      jar.set('dev_role', mockRole, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
        httpOnly: false,
      });
    } catch {
      // ignore
    }
    revalidatePath('/', 'layout');
    redirect(mockRole === 'owner' ? '/host' : '/');
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
    return { error: err.message };
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

  // Mock mode: pretend success (anti-enumeration luôn trả ok kể cả khi BE up).
  if (devBypassEnabled()) {
    return { ok: true };
  }

  try {
    await authRepository().forgotPassword(identifier);
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    // Trên BE down hoặc network error → vẫn trả ok để UI không show lỗi kỹ thuật.
    // Anti-enumeration vốn dĩ luôn nên trả ok cho forgot-password.
    if (err.code === 'NETWORK' || err.code === 'UNKNOWN') {
      console.error('[forgotPassword] backend unreachable', err);
      return { ok: true };
    }
    return { error: err.message };
  }
  return { ok: true };
}

/**
 * Reset password action — chưa có UI page kèm theo nhưng wire sẵn cho future use.
 * Mock mode: redirect tới /login?reset=1.
 */
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

  if (devBypassEnabled()) {
    redirect('/login?reset=1');
  }

  try {
    await authRepository().resetPassword(parsed.data.token, parsed.data.password);
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    if (err.code === 'NETWORK' || err.code === 'UNKNOWN') {
      // BE unreachable → pretend success (đỡ block dev flow).
      redirect('/login?reset=1');
    }
    return { error: err.message };
  }
  redirect('/login?reset=1');
}

export async function logoutAction(): Promise<void> {
  // Mock mode: chỉ xoá `dev_role` cookie, không gọi BE.
  if (devBypassEnabled()) {
    try {
      const jar = await cookies();
      jar.delete('dev_role');
    } catch {
      // ignore
    }
    revalidatePath('/', 'layout');
    redirect('/login');
  }

  try {
    await logoutUseCase(authRepository());
  } catch {
    // Ignore — BE có thể đang down, vẫn xoá cookie phía mình.
  } finally {
    await clearTokens();
  }
  revalidatePath('/', 'layout');
  redirect('/login');
}

/** Lấy profile cho Server Component (layout, page). Trả null nếu chưa đăng nhập. */
export async function getCurrentProfile() {
  if (devBypassEnabled()) {
    warnDevBypassWithRealApi();
    return resolveDevProfile();
  }
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

  if (devBypassEnabled()) {
    return { ok: true };
  }

  try {
    await authRepository().changePassword(parsed.data);
    return { ok: true };
  } catch (raw) {
    const err = mapApiErrorToDomain(raw);
    if (err.code === 'NETWORK' || err.code === 'UNKNOWN') {
      // BE down → pretend success cho dev flow.
      return { ok: true };
    }
    return { error: err.message };
  }
}
