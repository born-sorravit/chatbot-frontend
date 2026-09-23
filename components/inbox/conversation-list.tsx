'use client';

import Link from 'next/link';
import { Bot, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConversationMode, type InboxItem } from '@/types/api';

function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.trim().slice(0, 2).toUpperCase();
}

function relativeTime(iso: string | null): string {
  if (!iso) return '';

  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 1) return 'เมื่อสักครู่';
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชม.`;
  return `${Math.floor(hours / 24)} วัน`;
}

interface ConversationListProps {
  items: InboxItem[];
  activeId?: string;
  loading: boolean;
}

export function ConversationList({ items, activeId, loading }: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex items-center gap-3 p-2">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-1 p-10 text-center text-sm">
        <p>ยังไม่มีการสนทนา</p>
        <p className="text-xs">การสนทนาใหม่จะปรากฏที่นี่ทันที</p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <li key={item.id}>
            <Link
              href={`/inbox/${item.id}`}
              className={cn(
                'hover:bg-accent/60 flex items-start gap-3 border-b px-3 py-2.5 transition-colors',
                isActive && 'bg-accent',
              )}
            >
              <Avatar className="size-9">
                <AvatarFallback>{initials(item.customer?.name)}</AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-medium">
                    {item.customer?.name ?? 'ไม่ระบุชื่อ'}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-[11px]">
                    {relativeTime(item.lastMessageAt)}
                  </span>
                </div>

                <p className="text-muted-foreground truncate text-xs">
                  {item.lastMessage?.content ?? 'ยังไม่มีข้อความ'}
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className="gap-1 px-1.5 py-0 text-[10px] font-normal"
                  >
                    {item.mode === ConversationMode.Ai ? (
                      <Bot className="size-2.5" />
                    ) : (
                      <UserIcon className="size-2.5" />
                    )}
                    {item.mode}
                  </Badge>

                  {/* Where the customer is reaching us from. Hidden for the
                      web widget, which is the default and would be noise on
                      every row. */}
                  {item.channel !== 'web' && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal uppercase">
                      {item.channel}
                    </Badge>
                  )}

                  {item.status === 'CLOSED' && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                      ปิดแล้ว
                    </Badge>
                  )}

                  {item.assignedUser && (
                    <span className="text-muted-foreground truncate text-[10px]">
                      · {item.assignedUser.name}
                    </span>
                  )}

                  {item.unreadCount > 0 && (
                    <Badge className="ml-auto h-4 min-w-4 justify-center px-1 text-[10px]">
                      {item.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
