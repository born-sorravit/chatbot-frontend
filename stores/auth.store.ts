'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, PermissionValue } from '@/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** False until persisted state has been read back from storage. */
  hydrated: boolean;

  setSession: (session: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  markHydrated: () => void;
  clear: () => void;
  hasPermission: (permission: PermissionValue) => boolean;
}

/**
 * Auth session state.
 *
 * Persisted to localStorage so a page refresh does not log the admin out.
 * This is an MVP tradeoff, stated rather than hidden: anything stored here is
 * readable by an XSS on this origin. The access token is short-lived (15m)
 * and refresh tokens rotate with replay detection, which bounds the damage
 * but does not remove it. Moving to httpOnly cookies is a Phase 2 hardening
 * item, tracked in the Phase 1 summary.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),

      setTokens: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),

      markHydrated: () => set({ hydrated: true }),

      clear: () => set({ accessToken: null, refreshToken: null, user: null }),

      hasPermission: (permission) => get().user?.permissions.includes(permission) ?? false,
    }),
    {
      name: 'chatbots.auth',
      // `hydrated` is runtime-only — persisting it would make a fresh tab
      // believe it had already rehydrated.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
      // Hydration is triggered explicitly by <AuthHydration/> rather than on
      // store creation. Left automatic, localStorage would be read
      // synchronously on the client but not on the server, so the server and
      // the first client render would disagree — a React hydration mismatch.
      // Deferring it keeps both renders identical until the effect runs.
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);
