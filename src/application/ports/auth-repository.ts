import type {
  AuthTokens,
  OAuthSignInResult,
  UserProfile,
} from '@/core/entities/user';
import type { RoleCode } from '@/core/value-objects/role';

export interface LoginCredentials {
  /** Email hoặc số điện thoại (spec §2 — BE nhận `{ identifier, password }`). */
  identifier: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<RoleCode, 0>;
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

/** Spec §25.2 + v1.22 — whitelist 4 field, tất cả optional (ít nhất 1). */
export interface UpdateProfileInput {
  fullName?: string;
  email?: string;
  phone?: string;
  /** URL https (≤1000 ký tự) — upload trước qua `POST /uploads` (§23). */
  avatar?: string;
}

export interface AuthRepository {
  /** Spec v1.7 — chỉ trả tokens, caller phải gọi getProfile() riêng. */
  login(input: LoginCredentials): Promise<AuthTokens>;
  register(input: RegisterInput): Promise<AuthTokens>;
  /**
   * Spec v1.7 — Google sign-in mới chưa có role → trả `OAuthNewUserPrompt`
   * thay vì tokens. Caller phải prompt user chọn role rồi gọi lại với `role`.
   */
  loginWithGoogle(idToken: string, role?: RoleCode): Promise<OAuthSignInResult>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  forgotPassword(identifier: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  getProfile(): Promise<UserProfile>;
  /** Spec §25.2 — `PATCH /auth/profile`, trả full profile đã cập nhật. */
  updateProfile(input: UpdateProfileInput): Promise<UserProfile>;
  logout(): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
}
