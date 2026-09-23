'use client';

import { useMemo, useState } from 'react';
import { Inbox as InboxIcon, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConnectionBanner } from '@/components/chat/connection-banner';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ConversationPane } from '@/components/inbox/conversation-pane';
import { CustomerPanel } from '@/components/inbox/customer-panel';
import { useConversation, useInbox, useInboxRealtime } from '@/features/inbox/hooks';
import type { InboxFilters } from '@/features/inbox/api';

/**
 * The five tabs are filter combinations on one endpoint, not five endpoints
 * (docs/API.md §3).
 */
const TABS: { value: string; label: string; filters: InboxFilters }[] = [
  { value: 'all', label: 'ทั้งหมด', filters: {} },
  { value: 'ai', label: 'AI', filters: { mode: 'AI' } },
  { value: 'human', label: 'Human', filters: { mode: 'HUMAN' } },
  { value: 'unassigned', label: 'ยังไม่มอบหมาย', filters: { assignedUserId: 'unassigned' } },
  { value: 'closed', label: 'ปิดแล้ว', filters: { status: 'CLOSED' } },
];

function Workspace({ conversationId }: { conversationId?: string }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const filters = useMemo<InboxFilters>(
    () => ({
      ...(TABS.find((t) => t.value === tab)?.filters ?? {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [tab, search],
  );

  const inboxQuery = useInbox(filters);
  const conversationQuery = useConversation(conversationId);
  const { connectionState, customerTyping } = useInboxRealtime(conversationId);

  return (
    <>
      <ConnectionBanner state={connectionState} />

      <div className="flex min-h-0 flex-1">
        {/* Left — conversation list */}
        <aside className="flex w-80 shrink-0 flex-col border-r">
          <div className="flex flex-col gap-2 border-b p-3">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาลูกค้า..."
                className="h-8 pl-8 text-sm"
                aria-label="ค้นหาการสนทนา"
              />
            </div>

            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                {TABS.map((item) => (
                  <TabsTrigger key={item.value} value={item.value}>
                    {item.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <ConversationList
              items={inboxQuery.data?.data ?? []}
              activeId={conversationId}
              loading={inboxQuery.isPending}
            />
          </div>
        </aside>

        {/* Middle — the conversation */}
        <main className="min-w-0 flex-1">
          {conversationId ? (
            <ConversationPane
              key={conversationId}
              conversationId={conversationId}
              conversation={conversationQuery.data}
              loadingConversation={conversationQuery.isPending}
              customerTyping={customerTyping}
            />
          ) : (
            <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2">
              <InboxIcon className="size-8 opacity-40" />
              <p className="text-sm">เลือกการสนทนาเพื่อเริ่มตอบลูกค้า</p>
            </div>
          )}
        </main>

        {/* Right — customer profile */}
        <aside className="hidden w-72 shrink-0 overflow-y-auto border-l xl:block">
          {conversationId ? (
            <CustomerPanel
              conversation={conversationQuery.data}
              loading={conversationQuery.isPending}
            />
          ) : (
            <p className="text-muted-foreground p-4 text-sm">ไม่ได้เลือกการสนทนา</p>
          )}
        </aside>
      </div>
    </>
  );
}

/**
 * The socket comes from AdminShell, one level up — a message for a
 * conversation that is not currently open still has to bump the list badge,
 * and the notification bell in the header needs the same connection.
 */
export function InboxWorkspace({ conversationId }: { conversationId?: string }) {
  return <Workspace conversationId={conversationId} />;
}
