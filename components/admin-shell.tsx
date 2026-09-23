'use client';

import { SocketProvider } from '@/lib/socket';
import { useAuthStore } from '@/stores/auth.store';
import { AuthGuard } from '@/components/auth-guard';
import { AppHeader } from '@/components/app-header';

/**
 * Shared shell for every authenticated admin page.
 *
 * The socket lives here rather than inside the inbox so that exactly one
 * connection serves the whole admin surface: the notification bell is in the
 * header and must stay live on the dashboard, the agent form and the knowledge
 * base too — but opening a second socket per page would double the
 * connections and double every broadcast the client has to filter.
 */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <AuthGuard>
      <SocketProvider namespace="/ws/admin" token={accessToken}>
        <div className="flex min-h-dvh flex-col">
          <AppHeader />
          {children}
        </div>
      </SocketProvider>
    </AuthGuard>
  );
}
