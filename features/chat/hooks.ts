'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@/lib/socket';
import { fetchConversation, fetchMessages, markRead, requestHuman, sendMessage } from './api';
import type {
  AiThinkingEvent,
  AiThinkingStatus,
  CursorEnvelope,
  CustomerMessage,
  TypingEvent,
} from '@/types/api';
import { MessageSenderType, MessageType } from '@/types/api';

export const chatKeys = {
  conversation: ['chat', 'conversation'] as const,
  messages: ['chat', 'messages'] as const,
};

export function useChatConversation(enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.conversation,
    queryFn: fetchConversation,
    enabled,
  });
}

export function useChatMessages(enabled: boolean) {
  return useQuery({
    queryKey: chatKeys.messages,
    queryFn: () => fetchMessages(),
    enabled,
  });
}

/**
 * Appends a message into the cached transcript, de-duplicated.
 *
 * Socket events do not own data (docs/ARCHITECTURE.md §2.3) — they write into
 * the Query cache, so a reconnect refetch and a live event converge on the
 * same list instead of fighting.
 *
 * Dedupe is by `id`, plus `clientMessageId` so the server row replaces this
 * client's own optimistic bubble rather than appearing beside it.
 */
function upsertMessage(
  existing: CursorEnvelope<CustomerMessage> | undefined,
  incoming: CustomerMessage,
): CursorEnvelope<CustomerMessage> {
  const base = existing ?? { data: [], meta: { hasMore: false, nextCursor: null } };

  if (base.data.some((m) => m.id === incoming.id)) {
    return base;
  }

  const optimisticIndex = incoming.clientMessageId
    ? base.data.findIndex((m) => m.clientMessageId === incoming.clientMessageId)
    : -1;

  if (optimisticIndex >= 0) {
    const next = [...base.data];
    next[optimisticIndex] = incoming;
    return { ...base, data: next };
  }

  return { ...base, data: [...base.data, incoming] };
}

/**
 * AI progress copy.
 *
 * The server sends a status *enum*; this maps it to Thai. Rendering the raw
 * value — or anything the model authored — is how internal reasoning reaches
 * a customer's screen (§32).
 */
const AI_STATUS_COPY: Record<AiThinkingStatus, string> = {
  thinking: 'กำลังคิด...',
  searching_knowledge: 'กำลังค้นหาข้อมูล...',
  checking_order: 'กำลังตรวจสอบคำสั่งซื้อ...',
};

export function useChatRealtime(conversationId: string | undefined) {
  const queryClient = useQueryClient();
  const { state, reconnectCount } = useSocket();
  const [agentTyping, setAgentTyping] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const aiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSocketEvent<CustomerMessage>('message:new', (message) => {
    queryClient.setQueryData<CursorEnvelope<CustomerMessage>>(chatKeys.messages, (existing) =>
      upsertMessage(existing, message),
    );
  });

  useSocketEvent<AiThinkingEvent>('ai:thinking', (event) => {
    setAiStatus(AI_STATUS_COPY[event.status] ?? AI_STATUS_COPY.thinking);

    // Safety net: if the completion event is lost, the indicator still
    // clears instead of spinning forever.
    if (aiTimer.current) clearTimeout(aiTimer.current);
    aiTimer.current = setTimeout(() => setAiStatus(null), 30_000);
  });

  useSocketEvent<unknown>('ai:completed', () => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    setAiStatus(null);
  });

  // The customer is told a human is taking over, never why (§7).
  useSocketEvent<unknown>('ai:handoff', () => {
    if (aiTimer.current) clearTimeout(aiTimer.current);
    setAiStatus(null);
    void queryClient.invalidateQueries({ queryKey: chatKeys.conversation });
  });

  useSocketEvent<TypingEvent>('typing:start', (event) => {
    if (event.actorType !== 'ADMIN') return;
    setAgentTyping(event.actorName ?? 'เจ้าหน้าที่');

    // Safety net: if the stop event is lost, the indicator still clears
    // rather than hanging forever.
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setAgentTyping(null), 5_000);
  });

  useSocketEvent<TypingEvent>('typing:stop', (event) => {
    if (event.actorType !== 'ADMIN') return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setAgentTyping(null);
  });

  useSocketEvent<unknown>('conversation:updated', () => {
    void queryClient.invalidateQueries({ queryKey: chatKeys.conversation });
  });

  // Socket.IO is at-most-once, so anything emitted while this client was
  // offline is gone. Refetching on every (re)connect is what heals that.
  useEffect(() => {
    if (reconnectCount > 0 && conversationId) {
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages });
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversation });
    }
  }, [reconnectCount, conversationId, queryClient]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
      if (aiTimer.current) clearTimeout(aiTimer.current);
    };
  }, []);

  return { connectionState: state, agentTyping, aiStatus };
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMessage,
    onMutate: async ({ content, clientMessageId }) => {
      await queryClient.cancelQueries({ queryKey: chatKeys.messages });

      const optimistic: CustomerMessage = {
        id: `optimistic-${clientMessageId}`,
        senderType: MessageSenderType.Customer,
        senderName: null,
        content,
        type: MessageType.Text,
        createdAt: new Date().toISOString(),
        clientMessageId,
        pending: true,
      };

      queryClient.setQueryData<CursorEnvelope<CustomerMessage>>(chatKeys.messages, (existing) => {
        const base = existing ?? { data: [], meta: { hasMore: false, nextCursor: null } };
        return { ...base, data: [...base.data, optimistic] };
      });

      return { clientMessageId };
    },
    onSuccess: (message) => {
      queryClient.setQueryData<CursorEnvelope<CustomerMessage>>(chatKeys.messages, (existing) =>
        upsertMessage(existing, message),
      );
    },
    onError: (_error, variables) => {
      // Keep the bubble and mark it failed rather than deleting it — silently
      // dropping what someone typed is worse than showing it did not send.
      queryClient.setQueryData<CursorEnvelope<CustomerMessage>>(chatKeys.messages, (existing) => {
        if (!existing) return existing;
        return {
          ...existing,
          data: existing.data.map((m) =>
            m.clientMessageId === variables.clientMessageId
              ? { ...m, pending: false, failed: true }
              : m,
          ),
        };
      });
    },
  });
}

export function useRequestHuman() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: requestHuman,
    onSuccess: (conversation) => {
      queryClient.setQueryData(chatKeys.conversation, conversation);
      // The SYSTEM message the server inserted arrives over the socket, but
      // refetch so a customer with a dropped connection still sees it.
      void queryClient.invalidateQueries({ queryKey: chatKeys.messages });
    },
  });
}

/** Emits typing:start at most once per second, with an auto-stop. */
export function useTypingEmitter() {
  const { socket } = useSocket();
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(0);

  const onInput = useCallback(() => {
    if (!socket) return;

    const now = Date.now();
    if (now - lastSent.current > 1_000) {
      socket.emit('typing:start', {});
      lastSent.current = now;
    }

    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      socket.emit('typing:stop', {});
      lastSent.current = 0;
    }, 2_000);
  }, [socket]);

  const stopNow = useCallback(() => {
    if (!socket) return;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    socket.emit('typing:stop', {});
    lastSent.current = 0;
  }, [socket]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  return { onInput, stopNow };
}

export function useMarkRead(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      void markRead().catch(() => undefined);
    }
  }, [enabled]);
}
