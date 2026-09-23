'use client';

import { useAuthStore } from '@/stores/auth.store';
import { ApiError } from './api-error';
import type { AuthResult } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Internal: prevents a refresh loop. */
  skipRefresh?: boolean;
}

/**
 * Single in-flight refresh, within this tab.
 *
 * Without it, a page that fires several queries at once would send several
 * refresh requests carrying the same token. Because refresh rotates and
 * revokes, the second looks like a replay to the backend and burns the whole
 * token family — logging the admin out for doing nothing wrong.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Cross-tab mutual exclusion.
 *
 * `refreshInFlight` is module-scoped, so each tab has its own copy — it does
 * nothing across tabs, which is exactly where the same race reappears: two
 * tabs holding the same expired token both refresh, the second is treated as
 * a replay, and the admin is signed out everywhere. The admin inbox is a
 * multi-tab workflow by nature, so this matters in practice.
 *
 * Web Locks are shared across same-origin tabs. Where unavailable (older
 * browsers, non-secure contexts) this degrades to running unguarded, which is
 * the previous behaviour rather than a new failure.
 */
async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return fn();
  }
  return navigator.locks.request('chatbots.auth.refresh', fn);
}

async function performRefresh(): Promise<boolean> {
  const { refreshToken, setTokens, clear } = useAuthStore.getState();

  if (!refreshToken) {
    clear();
    return false;
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      clear();
      return false;
    }

    const payload = (await response.json()) as { data: AuthResult };
    setTokens({
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken,
    });
    return true;
  } catch {
    clear();
    return false;
  }
}

/**
 * @param staleAccessToken the token that just received a 401, used to detect
 *   that another tab already refreshed while this one waited for the lock.
 */
function refreshOnce(staleAccessToken: string | null): Promise<boolean> {
  refreshInFlight ??= withRefreshLock(async () => {
    // Re-read persisted state inside the lock: another tab may have rotated
    // the tokens while this one was queued.
    await useAuthStore.persist.rehydrate();

    const current = useAuthStore.getState().accessToken;

    // Someone else already refreshed. Rotating again would be pointless
    // extra churn — just retry with what they obtained.
    if (current && current !== staleAccessToken) {
      return true;
    }

    return performRefresh();
  }).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipRefresh, headers, ...init } = options;
  const { accessToken } = useAuthStore.getState();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    // The customer session cookie is httpOnly and the API is a different
    // origin in dev, so fetch's default 'same-origin' would drop it.
    credentials: 'include',
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshOnce(accessToken);

    if (refreshed) {
      return request<T>(path, { ...options, skipRefresh: true });
    }
  }

  if (!response.ok) {
    throw await ApiError.fromResponse(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
