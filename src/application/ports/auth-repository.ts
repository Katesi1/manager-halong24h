import type { AuthSession, UserProfile } from '@/core/entities/user';
import type { RoleCode } from '@/core/value-objects/role';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role: Exclude<RoleCode, 0>; // Không cho đăng ký ADMIN
  phone?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface AuthRepository {
  login(input: LoginCredentials): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  loginWithGoogle(idToken: string, role?: RoleCode): Promise<AuthSession>;
  refresh(refreshToken: string): Promise<Pick<AuthSession, 'accessToken' | 'refreshToken'>>;
  forgotPassword(identifier: string): Promise<void>;
  resetPassword(token: string, newPassword: string): Promise<void>;
  getProfile(): Promise<UserProfile>;
  logout(): Promise<void>;
  changePassword(input: ChangePasswordInput): Promise<void>;
}
