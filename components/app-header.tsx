'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Bot,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Plug,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { Permission, type PermissionValue } from '@/types/api';
import { useLogout } from '@/features/auth/hooks';
import { NotificationBell } from '@/components/notifications/notification-bell';

/**
 * `permission` hides a link the user cannot open. The route's data is
 * protected server-side regardless; this only avoids sending an AGENT to a
 * page that would greet them with an error.
 */
const NAV: ReadonlyArray<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission?: PermissionValue;
}> = [
  { href: '/dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { href: '/inbox', label: 'กล่องข้อความ', icon: Inbox },
  { href: '/ai-agents', label: 'AI Agent', icon: Bot },
  { href: '/knowledge-bases', label: 'Knowledge Base', icon: BookOpen },
  { href: '/analytics', label: 'รายงาน', icon: BarChart3 },
  { href: '/channels', label: 'ช่องทาง', icon: Plug, permission: Permission.SettingsRead },
];

export function AppHeader() {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const logoutMutation = useLogout();
  const pathname = usePathname();

  const nav = NAV.filter((item) => !item.permission || hasPermission(item.permission));

  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b backdrop-blur">
      <div className="flex h-14 items-center justify-between gap-4 px-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-lg">
            <MessageSquareText className="size-4" />
          </div>
          <span className="text-sm font-semibold">AI Customer Support</span>

          <nav className="ml-4 flex items-center gap-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href as never}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors',
                  pathname.startsWith(item.href)
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <item.icon className="size-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />

          {user && (
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">{user.name}</p>
              <p className="text-muted-foreground text-xs leading-tight">{user.role}</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            <LogOut className="size-4" />
            ออกจากระบบ
          </Button>
        </div>
      </div>
    </header>
  );
}
