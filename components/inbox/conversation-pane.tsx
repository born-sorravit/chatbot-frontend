'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  HandHelping,
  RotateCcw,
  Send,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { MessageBubble } from '@/components/chat/message-bubble';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import {
  useAdminTypingEmitter,
  useConversationActions,
  useMarkConversationRead,
  useMessages,
  useReply,
} from '@/features/inbox/hooks';
import { ConversationMode, ConversationStatus, MessageSenderType } from '@/types/api';
import { ApiError } from '@/lib/api-error';
import type { ConversationDetail } from '@/types/api';

const HANDOFF_LABEL: Record<string, string> = {
  CUSTOMER_REQUESTED: 'ลูกค้าขอคุยกับพนักงาน',
  AI_CANNOT_ANSWER: 'AI ตอบไม่ได้',
  NO_KNOWLEDGE_FOUND: 'ไม่พบข้อมูลใน Knowledge Base',
  TOOL_ERROR: 'Tool ทำงานผิดพลาด',
  PROVIDER_ERROR: 'ระบบ AI ขัดข้อง',
  SENSITIVE_TOPIC: 'เรื่องละเอียดอ่อน',
  BUSINESS_RULE: 'กฎของธุรกิจ',
  MANUAL_TAKEOVER: 'แอดมินรับช่วงเอง',
};

interface ConversationPaneProps {
  conversationId: string;
  conversation?: ConversationDetail;
  loadingConversation: boolean;
  customerTyping: string | null;
}

/**
 * Mounted with `key={conversationId}` by the workspace, so switching
 * conversations remounts this component and the draft resets naturally —
 * no effect needed, and no frame where the previous reply is still in the box.
 */
export function ConversationPane({
  conversationId,
  conversation,
  loadingConversation,
  customerTyping,
}: ConversationPaneProps) {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useMessages(conversationId);
  const replyMutation = useReply(conversationId);
  const actions = useConversationActions(conversationId);

  // Returning to AI fails with 409 when no agent is configured — handing the
  // conversation back to an AI that cannot run would strand the customer.
  const returnToAiError = actions.returnToAi.error;
  const returnError =
    returnToAiError instanceof ApiError &&
    returnToAiError.code === 'AI_AGENT_NOT_CONFIGURED';
  const { onInput, stopNow } = useAdminTypingEmitter(conversationId);

  useMarkConversationRead(conversationId, conversation?.unreadCount ?? 0);

  const messages = messagesQuery.data?.data ?? [];
  const isClosed = conversation?.status === ConversationStatus.Closed;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, customerTyping]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || replyMutation.isPending) return;

    stopNow();
    setDraft('');
    replyMutation.mutate({ content, clientMessageId: crypto.randomUUID() });
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {loadingConversation ? (
            <Skeleton className="h-4 w-32" />
          ) : (
            <>
              <span className="truncate text-sm font-semibold">
                {conversation?.customer?.name ?? 'ไม่ระบุชื่อ'}
              </span>
              <Badge variant="outline" className="gap-1 px-1.5 py-0 text-[10px] font-normal">
                {conversation?.mode === ConversationMode.Ai ? (
                  <Bot className="size-2.5" />
                ) : (
                  <UserIcon className="size-2.5" />
                )}
                {conversation?.mode}
              </Badge>
              {isClosed && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-normal">
                  ปิดแล้ว
                </Badge>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/*
            Take Over / Return to AI (master plan §30, §31).

            Only one is ever shown, because they are opposite states rather
            than two independent actions — offering both would make the
            current mode ambiguous.
          */}
          {conversation?.mode === ConversationMode.Ai ? (
            <Button
              size="sm"
              onClick={() => actions.takeOver.mutate()}
              disabled={actions.takeOver.isPending}
            >
              <HandHelping className="size-3.5" />
              รับช่วงต่อ
            </Button>
          ) : (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => actions.returnToAi.mutate()}
              disabled={actions.returnToAi.isPending}
              title="ให้ AI ดูแลการสนทนานี้ต่อ"
            >
              <Sparkles className="size-3.5" />
              คืนให้ AI
            </Button>
          )}

          {isClosed ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => actions.reopen.mutate()}
              disabled={actions.reopen.isPending}
            >
              <RotateCcw className="size-3.5" />
              เปิดใหม่
            </Button>
          ) : (
            // Closing is destructive from the customer's point of view —
            // confirm before doing it (master plan §50).
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <CheckCircle2 className="size-3.5" />
                  ปิดการสนทนา
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>ปิดการสนทนานี้?</DialogTitle>
                  <DialogDescription>
                    ลูกค้ายังส่งข้อความได้ และการสนทนาจะเปิดใหม่อัตโนมัติเมื่อมีข้อความเข้ามา
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    onClick={() => actions.close.mutate(undefined)}
                    disabled={actions.close.isPending}
                  >
                    ยืนยันปิด
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      {returnError && (
        <div className="text-destructive border-b bg-red-500/10 px-4 py-2 text-xs">
          คืนให้ AI ไม่ได้ — ยังไม่มี AI Agent ที่เปิดใช้งานในองค์กรนี้
        </div>
      )}

      {/* Admin-only: the customer never receives this reason (docs/API.md §7). */}
      {conversation?.handoffReason && (
        <div className="flex items-center gap-2 border-b bg-amber-500/10 px-4 py-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span>
            AI ส่งต่อให้แอดมิน — เหตุผล:{' '}
            <span className="font-medium">{HANDOFF_LABEL[conversation.handoffReason] ?? conversation.handoffReason}</span>
          </span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          {messagesQuery.isPending && (
            <>
              <Skeleton className="h-10 w-48 self-start rounded-2xl" />
              <Skeleton className="h-10 w-56 self-end rounded-2xl" />
            </>
          )}

          {messagesQuery.isError && (
            <p className="text-destructive py-8 text-center text-sm">ไม่สามารถโหลดข้อความได้</p>
          )}

          {messagesQuery.isSuccess && messages.length === 0 && (
            <p className="text-muted-foreground py-8 text-center text-sm">ยังไม่มีข้อความ</p>
          )}

          {messages.map((message, index) => {
            // Only label the first message of a run: repeating the name above
            // every consecutive bubble is noise in a busy thread.
            const previous = messages[index - 1];
            const startsRun = previous?.senderType !== message.senderType;

            return (
            <MessageBubble
              key={message.id}
              content={message.content}
              senderType={message.senderType}
              senderName={
                startsRun && message.senderType === MessageSenderType.Customer
                  ? (conversation?.customer?.name ?? 'ลูกค้า')
                  : null
              }
              createdAt={message.createdAt}
              // The admin's own side of the thread is AI or ADMIN.
              own={
                message.senderType === MessageSenderType.Admin ||
                message.senderType === MessageSenderType.Ai
              }
              pending={message.pending}
              failed={message.failed}
            />
            );
          })}

          {customerTyping && <TypingIndicator name={customerTyping} />}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onInput();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="พิมพ์ข้อความตอบลูกค้า... (Enter ส่ง, Shift+Enter ขึ้นบรรทัดใหม่)"
            rows={1}
            maxLength={4000}
            className="max-h-40 min-h-10 resize-none"
            aria-label="ข้อความตอบกลับ"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || replyMutation.isPending}>
            <Send className="size-4" />
            <span className="sr-only">ส่ง</span>
          </Button>
        </div>
        {conversation?.mode === ConversationMode.Ai && (
          <p className="text-muted-foreground mt-2 text-[11px]">
            การตอบกลับจะเปลี่ยนโหมดเป็น HUMAN และ AI จะหยุดตอบอัตโนมัติ
          </p>
        )}
      </form>
    </div>
  );
}
