'use client';

import { apiClient } from '@/lib/api-client';
import type { ApiEnvelope, AuthResult, AuthUser } from '@/types/api';
import type { LoginInput } from './schema';

export async function login(input: LoginInput): Promise<AuthResult> {
  const response = await apiClient.post<ApiEnvelope<AuthResult>>('/auth/login', input, {
    // A failed login must surface as 401, not trigger a refresh attempt.
    skipRefresh: true,
  });
  return response.data;
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await apiClient.get<ApiEnvelope<AuthUser>>('/auth/me');
  return response.data;
}

export async function logout(refreshToken: string | null): Promise<void> {
  await apiClient.post<void>('/auth/logout', refreshToken ? { refreshToken } : {});
}
