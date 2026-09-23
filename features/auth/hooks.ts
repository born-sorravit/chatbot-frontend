'use client';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { login, logout } from './api';
import type { LoginInput } from './schema';

export function useLogin() {
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (result) => {
      setSession(result);
      router.replace('/dashboard');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    // Read at call time, not at render time. A token captured during render
    // goes stale the moment the API client rotates it, and logout would then
    // present a revoked token — which the backend treats as a replay.
    mutationFn: () => logout(useAuthStore.getState().refreshToken),
    // Runs on success and failure alike: if the server call fails, the local
    // session must still be dropped, or the user stays "logged in" with
    // credentials the server has already rejected.
    onSettled: () => {
      useAuthStore.getState().clear();
      queryClient.clear();
      router.replace('/login');
    },
  });
}
