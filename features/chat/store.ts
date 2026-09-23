'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatSessionState {
  /**
   * Mirror of the httpOnly session cookie.
   *
   * The cookie is the real credential and the server reads it first; this
   * copy exists only as a fallback for browsers that block the cookie
   * cross-origin, where it is passed as a bearer token instead. It is not a
   * second source of truth.
   */
  sessionToken: string | null;
  customerName: string | null;
  hydrated: boolean;
  setSession: (session: { sessionToken: string; customerName: string | null }) => void;
  markHydrated: () => void;
  clear: () => void;
}

export const useChatSessionStore = create<ChatSessionState>()(
  persist(
    (set) => ({
      sessionToken: null,
      customerName: null,
      hydrated: false,
      setSession: ({ sessionToken, customerName }) => set({ sessionToken, customerName }),
      markHydrated: () => set({ hydrated: true }),
      clear: () => set({ sessionToken: null, customerName: null }),
    }),
    {
      name: 'chatbots.chat-session',
      partialize: (state) => ({
        sessionToken: state.sessionToken,
        customerName: state.customerName,
      }),
      // Same reasoning as the admin store: deferred so the server render and
      // the first client render agree.
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.markHydrated(),
    },
  ),
);
