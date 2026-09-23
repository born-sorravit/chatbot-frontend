'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as motion from 'motion/react-client';
import { Bell, BellRing, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useNotifications, notificationKeys } from '@/features/notifications/hooks';
import { markAllNotificationsRead, markNotificationRead } from '@/features/notifications/api';
import { NotificationType, type AppNotification } from '@/types/api';

const TYPE_TONE: Record<string, string> = {
  [NotificationType.CustomerRequestedHuman]: 'text-red-600 dark:text-red-400',
  [NotificationType.AiHandoff]: 'text-amber-600 dark:text-amber-400',
  [NotificationType.NewConversation]: 'text-blue-600 dark:text-blue-400',
  [NotificationType.NewMessage]: 'text-muted-foreground',
};

function relativeTime(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.`;
  return `${Math.floor(hours / 24)} วัน`;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useNotifications();

  const unread = query.data?.meta.unreadCount ?? 0;
  const notifications = query.data?.data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: notificationKeys.all });

  const readMutation = useMutation({ mutationFn: markNotificationRead, onSuccess: invalidate });
  const readAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidate,
  });

  function openNotification(notification: AppNotification) {
    if (!notification.readAt) readMutation.mutate(notification.id);
    setOpen(false);
    if (notification.conversationId) {
      router.push(`/inbox/${notification.conversationId}`);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((value) => !value)}
        aria-label={`การแจ้งเตือน${unread > 0 ? ` (${unread} รายการใหม่)` : ''}`}
      >
        {unread > 0 ? <BellRing className="size-4" /> : <Bell className="size-4" />}
        {unread > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-0.5 -right-0.5 h-4 min-w-4 justify-center px-1 text-[10px]"
          >
            {unread > 9 ? '9+' : unread}
          </Badge>
        )}
      </Button>

      {open && (
        <>
          {/* Click-away layer. A plain overlay rather than a Radix popover:
              this is one dropdown, and the primitive would be more code than
              the feature itself. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />

          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-popover absolute right-0 z-50 mt-2 w-80 rounded-lg border shadow-lg"
            role="dialog"
            aria-label="การแจ้งเตือน"
          >
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-medium">การแจ้งเตือน</span>
              {unread > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => readAllMutation.mutate()}
                  disabled={readAllMutation.isPending}
                >
                  <CheckCheck className="size-3" />
                  อ่านทั้งหมด
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 && (
                <p className="text-muted-foreground p-6 text-center text-sm">
                  ยังไม่มีการแจ้งเตือน
                </p>
              )}

              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => openNotification(notification)}
                  className={cn(
                    'hover:bg-accent/60 flex w-full flex-col items-start gap-0.5 border-b px-3 py-2.5 text-left transition-colors last:border-b-0',
                    !notification.readAt && 'bg-accent/30',
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <span
                      className={cn(
                        'text-xs font-medium',
                        TYPE_TONE[notification.type] ?? 'text-foreground',
                      )}
                    >
                      {notification.title}
                    </span>
                    {!notification.readAt && (
                      <span className="bg-primary size-1.5 shrink-0 rounded-full" />
                    )}
                    <span className="text-muted-foreground ml-auto text-[10px]">
                      {relativeTime(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-muted-foreground line-clamp-2 text-xs">
                    {notification.message}
                  </p>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
