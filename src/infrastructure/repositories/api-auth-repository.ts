import 'server-only';

import type { AuthSession, UserProfile } from '@/core/entities/user';
import type { RoleCode } from '@/core/value-objects/role';
import type {
  AuthRepository,
  ChangePasswordInput,
  LoginCredentials,
  RegisterInput,
} from '@/application/ports/auth-repository';

import { apiClient } from '../http/api-client';

export class ApiAuthRepository implements AuthRepository {
  async login(input: LoginCredentials): Promise<AuthSession> {
    return apiClient.post<AuthSession>('/auth/login', input, {
      skipAuth: true,
    });
  }

  async register(input: RegisterInput): Promise<AuthSession> {
    return apiClient.post<AuthSession>('/auth/register', input, {
      skipAuth: true,
    });
  }

  async loginWithGoogle(idToken: string, role?: RoleCode): Promise<AuthSession> {
    return apiClient.post<AuthSession>(
      '/auth/google',
      { idToken, role },
      { skipAuth: true },
    );
  }

  async refresh(refreshToken: string) {
    return apiClient.post<{ accessToken: string; refreshToken: string }>(
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
    await apiClient.post(
      '/auth/reset-password',
      { token, newPassword },
      { skipAuth: true },
    );
  }

  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/auth/profile');
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async changePassword(input: ChangePasswordInput): Promise<void> {
    await apiClient.post('/auth/change-password', input);
  }
}
