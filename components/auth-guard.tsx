'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Client-side route guard.
 *
 * This is a UX affordance, not a security control — every protected endpoint
 * is enforced server-side by JwtAuthGuard and PermissionsGuard. Bypassing
 * this component gets you an empty screen and a 401, not data.
 *
 * It waits for `hydrated` so an authenticated admin is never bounced to the
 * login page by a rehydration race on refresh.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((state) => state.hydrated);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    if (hydrated && !accessToken) {
      router.replace('/login');
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated || !accessToken) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
        <span className="sr-only">กำลังโหลด</span>
      </div>
    );
  }

  return <>{children}</>;
}
