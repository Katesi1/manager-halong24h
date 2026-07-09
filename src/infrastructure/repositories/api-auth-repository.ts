import 'server-only';

import type {
  AuthTokens,
  OAuthSignInResult,
  UserProfile,
} from '@/core/entities/user';
import type { RoleCode } from '@/core/value-objects/role';
import type {
  AuthRepository,
  ChangePasswordInput,
  LoginCredentials,
  RegisterInput,
  UpdateProfileInput,
} from '@/application/ports/auth-repository';

import { apiClient } from '../http/api-client';

export class ApiAuthRepository implements AuthRepository {
  async login(input: LoginCredentials): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/login', input, {
      skipAuth: true,
    });
  }

  async register(input: RegisterInput): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>('/auth/register', input, {
      skipAuth: true,
    });
  }

  async loginWithGoogle(
    idToken: string,
    role?: RoleCode,
  ): Promise<OAuthSignInResult> {
    return apiClient.post<OAuthSignInResult>(
      '/auth/google',
      { idToken, role },
      { skipAuth: true },
    );
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    return apiClient.post<AuthTokens>(
      '/auth/refresh',
      { refreshToken },
      { skipAuth: true },
    );
  }

  async forgotPassword(identifier: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { identifier }, {
      skipAuth: true,
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // BE yêu cầu cả `confirmPassword` (spec §2.2 ghi body chỉ {token,newPassword}
    // nhưng DTO thực tế đòi confirmPassword khớp — verify bằng curl 2026-07-09).
    // Trang FE đã chặn submit khi password !== confirm nên gửi lại chính giá trị
    // đã xác nhận là hợp lệ.
    await apiClient.post(
      '/auth/reset-password',
      { token, newPassword, confirmPassword: newPassword },
      { skipAuth: true },
    );
  }

  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/profile');
  }

  async updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
    return apiClient.patch<UserProfile>('/auth/profile', input);
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.post('/auth/change-password', input);
  }
}
