'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Triggers the persisted auth store's rehydration, once, after mount.
 *
 * The store sets `skipHydration: true` so that the server render and the
 * first client render agree (both see no session). This effect runs only in
 * the browser, so reading localStorage here cannot cause a mismatch.
 */
export function AuthHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
  }, []);

  return null;
}
