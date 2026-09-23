'use client';

import { useEffect, useRef, useState } from 'react';
import { Headset, MessageSquareText, Send } from 'lucide-react';
import { SocketProvider } from '@/lib/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from '@/components/chat/message-bubble';
import { TypingIndicator } from '@/components/chat/typing-indicator';
import { ConnectionBanner } from '@/components/chat/connection-banner';
import { useChatSessionStore } from '@/features/chat/store';
import { startSession } from '@/features/chat/api';
import {
  useChatConversation,
  useChatMessages,
  useChatRealtime,
  useMarkRead,
  useRequestHuman,
  useSendMessage,
  useTypingEmitter,
} from '@/features/chat/hooks';
import { ConversationMode, ConversationStatus, MessageSenderType } from '@/types/api';

const ORGANIZATION_SLUG = process.env.NEXT_PUBLIC_ORG_SLUG ?? 'acme';

/** Identity bootstrap — one short form, then straight into the conversation. */
function StartForm({ onStarted }: { onStarted: () => void }) {
  const [name, setName] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setSession = useChatSessionStore((s) => s.setSession);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const session = await startSession({
        organizationSlug: ORGANIZATION_SLUG,
        name: name.trim() || undefined,
      });
      setSession({ sessionToken: session.sessionToken, customerName: session.customer.name });
      onStarted();
    } catch {
      setError('ไม่สามารถเริ่มการสนทนาได้ กรุณาลองใหม่');
      setPending(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl">
            <MessageSquareText className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">แชทกับเรา</h1>
          <p className="text-muted-foreground text-sm">ทีมงานพร้อมช่วยเหลือคุณ</p>
        </div>

        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อของคุณ (ไม่บังคับ)"
          maxLength={200}
          aria-label="ชื่อของคุณ"
        />

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? 'กำลังเริ่ม...' : 'เริ่มแชท'}
        </Button>
      </form>
    </div>
  );
}

function ChatRoom() {
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversationQuery = useChatConversation(true);
  const messagesQuery = useChatMessages(true);
  const sendMutation = useSendMessage();
  const { connectionState, agentTyping, aiStatus } = useChatRealtime(conversationQuery.data?.id);
  const { onInput, stopNow } = useTypingEmitter();
  const requestHumanMutation = useRequestHuman();

  useMarkRead(Boolean(conversationQuery.data));

  const messages = messagesQuery.data?.data ?? [];
  const isClosed = conversationQuery.data?.status === ConversationStatus.Closed;
  const withHuman = conversationQuery.data?.mode === ConversationMode.Human;

  // Pin to the newest message. Also runs when the typing indicator appears so
  // it does not push the latest message out of view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, agentTyping, aiStatus]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || sendMutation.isPending) return;

    stopNow();
    setDraft('');
    sendMutation.mutate({ content, clientMessageId: crypto.randomUUID() });
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-2.5 border-b px-4 py-3">
        <div className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg">
          <MessageSquareText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">ฝ่ายบริการลูกค้า</p>
          <p className="text-muted-foreground text-xs">
            {connectionState !== 'connected'
              ? 'กำลังเชื่อมต่อ...'
              : withHuman
                ? 'กำลังคุยกับเจ้าหน้าที่'
                : 'ตอบโดย AI'}
          </p>
        </div>

        {/*
          §53: an explicit button alongside natural-language detection. A
          phrasing the model fails to recognise is a customer left waiting,
          and pressing this never consults the AI at all.
        */}
        {!withHuman && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => requestHumanMutation.mutate()}
            disabled={requestHumanMutation.isPending}
          >
            <Headset className="size-3.5" />
            คุยกับเจ้าหน้าที่
          </Button>
        )}
      </header>

      <ConnectionBanner state={connectionState} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-3 p-4">
          {messagesQuery.isPending && (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-44 self-start rounded-2xl" />
              <Skeleton className="h-10 w-56 self-end rounded-2xl" />
              <Skeleton className="h-10 w-36 self-start rounded-2xl" />
            </div>
          )}

          {messagesQuery.isError && (
            <p className="text-destructive py-8 text-center text-sm">
              ไม่สามารถโหลดข้อความได้
            </p>
          )}

          {messagesQuery.isSuccess && messages.length === 0 && (
            <div className="text-muted-foreground py-12 text-center text-sm">
              <p>เริ่มต้นการสนทนาได้เลยครับ</p>
            </div>
          )}

          {messages.map((message, index) => {
            const previous = messages[index - 1];
            // Same grouping as the admin pane — label only the first of a run.
            const startsRun =
              previous?.senderType !== message.senderType ||
              previous?.senderName !== message.senderName;

            return (
            <MessageBubble
              key={message.id}
              content={message.content}
              senderType={message.senderType}
              senderName={startsRun ? message.senderName : null}
              createdAt={message.createdAt}
              own={message.senderType === MessageSenderType.Customer}
              pending={message.pending}
              failed={message.failed}
            />
            );
          })}

          {agentTyping && <TypingIndicator name={agentTyping} />}
          {!agentTyping && aiStatus && <TypingIndicator name={aiStatus} />}

          {isClosed && (
            <p className="text-muted-foreground py-2 text-center text-xs">
              การสนทนานี้ปิดแล้ว — ส่งข้อความใหม่เพื่อเปิดอีกครั้ง
            </p>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={submit} className="border-t p-3">
        <div className="mx-auto flex max-w-2xl items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              onInput();
            }}
            onKeyDown={(e) => {
              // Enter sends, Shift+Enter breaks the line — chat convention.
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit(e);
              }
            }}
            placeholder="พิมพ์ข้อความ..."
            rows={1}
            maxLength={4000}
            className="max-h-32 min-h-10 resize-none"
            aria-label="ข้อความ"
          />
          <Button type="submit" size="icon" disabled={!draft.trim() || sendMutation.isPending}>
            <Send className="size-4" />
            <span className="sr-only">ส่ง</span>
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function CustomerChatPage() {
  const hydrated = useChatSessionStore((s) => s.hydrated);
  const sessionToken = useChatSessionStore((s) => s.sessionToken);
  const markHydrated = useChatSessionStore((s) => s.markHydrated);

  useEffect(() => {
    void useChatSessionStore.persist.rehydrate();
  }, [markHydrated]);

  if (!hydrated) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Skeleton className="size-8 rounded-full" />
      </div>
    );
  }

  if (!sessionToken) {
    return (
      <div className="flex h-dvh flex-col">
        <StartForm onStarted={() => undefined} />
      </div>
    );
  }

  return (
    <SocketProvider namespace="/ws/customer" token={sessionToken}>
      <ChatRoom />
    </SocketProvider>
  );
}
