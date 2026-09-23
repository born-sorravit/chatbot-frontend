'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket, useSocketEvent } from '@/lib/socket';
import {
  assignConversation,
  closeConversation,
  fetchConversation,
  fetchInbox,
  fetchMessages,
  markRead,
  reopenConversation,
  reply,
  returnConversationToAi,
  takeOverConversation,
  type InboxFilters,
} from './api';
import type { AdminMessage, CursorEnvelope, InboxItem, TypingEvent } from '@/types/api';
import { MessageSenderType, MessageType } from '@/types/api';

export const inboxKeys = {
  list: (filters: InboxFilters) => ['inbox', 'list', filters] as const,
  all: ['inbox'] as const,
  conversation: (id: string) => ['inbox', 'conversation', id] as const,
  messages: (id: string) => ['inbox', 'messages', id] as const,
};

export function useInbox(filters: InboxFilters) {
  return useQuery({
    queryKey: inboxKeys.list(filters),
    queryFn: () => fetchInbox(filters),
    // The list is kept fresh by socket events; this is a safety net for a
    // tab that was backgrounded long enough to miss them.
    refetchOnWindowFocus: true,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: inboxKeys.conversation(id ?? ''),
    queryFn: () => fetchConversation(id as string),
    enabled: Boolean(id),
  });
}

export function useMessages(id: string | undefined) {
  return useQuery({
    queryKey: inboxKeys.messages(id ?? ''),
    queryFn: () => fetchMessages(id as string),
    enabled: Boolean(id),
  });
}

function upsert(
  existing: CursorEnvelope<AdminMessage> | undefined,
  incoming: AdminMessage,
): CursorEnvelope<AdminMessage> {
  const base = existing ?? { data: [], meta: { hasMore: false, nextCursor: null } };

  if (base.data.some((m) => m.id === incoming.id)) {
    return base;
  }

  const clientId = incoming.metadata?.clientMessageId;
  const optimisticIndex =
    typeof clientId === 'string'
      ? base.data.findIndex((m) => m.metadata?.clientMessageId === clientId)
      : -1;

  if (optimisticIndex >= 0) {
    const next = [...base.data];
    next[optimisticIndex] = incoming;
    return { ...base, data: next };
  }

  return { ...base, data: [...base.data, incoming] };
}

/**
 * Wires socket events into the Query cache for the whole inbox.
 *
 * Mounted once at the inbox layout, not per-pane: a `message:new` for a
 * conversation the admin does not currently have open still needs to bump the
 * list badge.
 */
export function useInboxRealtime(activeConversationId: string | undefined) {
  const queryClient = useQueryClient();
  const { socket, state, reconnectCount } = useSocket();
  const [customerTyping, setCustomerTyping] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSocketEvent<AdminMessage>('message:new', (message) => {
    if (message.conversationId === activeConversationId) {
      queryClient.setQueryData<CursorEnvelope<AdminMessage>>(
        inboxKeys.messages(message.conversationId),
        (existing) => upsert(existing, message),
      );
    }
    // Any conversation's new message changes the list ordering and badges.
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  });

  useSocketEvent<InboxItem>('conversation:updated', () => {
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  });

  useSocketEvent<InboxItem>('conversation:new', () => {
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
  });

  useSocketEvent<TypingEvent>('typing:start', (event) => {
    if (event.actorType !== 'CUSTOMER' || event.conversationId !== activeConversationId) return;
    setCustomerTyping('ลูกค้า');
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setCustomerTyping(null), 5_000);
  });

  useSocketEvent<TypingEvent>('typing:stop', (event) => {
    if (event.actorType !== 'CUSTOMER' || event.conversationId !== activeConversationId) return;
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setCustomerTyping(null);
  });

  // Join the conversation room so per-conversation events arrive.
  useEffect(() => {
    if (!socket || !activeConversationId) return;

    void socket.emitWithAck('conversation:subscribe', { conversationId: activeConversationId });

    return () => {
      socket.emit('conversation:unsubscribe', { conversationId: activeConversationId });
    };
  }, [socket, activeConversationId, reconnectCount]);

  // At-most-once delivery means a reconnect must refetch, or the inbox shows
  // whatever it had when the connection dropped.
  useEffect(() => {
    if (reconnectCount > 0) {
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    }
  }, [reconnectCount, queryClient]);

  // Adjusting state during render when a prop changes is the supported
  // pattern; doing it in an effect would render one frame showing the
  // previous conversation's typing indicator.
  const [trackedConversationId, setTrackedConversationId] = useState(activeConversationId);
  if (trackedConversationId !== activeConversationId) {
    setTrackedConversationId(activeConversationId);
    setCustomerTyping(null);
  }

  return { connectionState: state, customerTyping };
}

export function useReply(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { content: string; clientMessageId: string }) =>
      reply(conversationId, input),
    onMutate: async ({ content, clientMessageId }) => {
      await queryClient.cancelQueries({ queryKey: inboxKeys.messages(conversationId) });

      const optimistic: AdminMessage = {
        id: `optimistic-${clientMessageId}`,
        conversationId,
        senderType: MessageSenderType.Admin,
        senderId: null,
        content,
        type: MessageType.Text,
        metadata: { clientMessageId },
        readAt: null,
        createdAt: new Date().toISOString(),
        pending: true,
      };

      queryClient.setQueryData<CursorEnvelope<AdminMessage>>(
        inboxKeys.messages(conversationId),
        (existing) => {
          const base = existing ?? { data: [], meta: { hasMore: false, nextCursor: null } };
          return { ...base, data: [...base.data, optimistic] };
        },
      );
    },
    onSuccess: (message) => {
      queryClient.setQueryData<CursorEnvelope<AdminMessage>>(
        inboxKeys.messages(conversationId),
        (existing) => upsert(existing, message),
      );
      // A reply flips mode to HUMAN and may assign — refetch the header.
      void queryClient.invalidateQueries({ queryKey: inboxKeys.conversation(conversationId) });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
    onError: (_error, variables) => {
      queryClient.setQueryData<CursorEnvelope<AdminMessage>>(
        inboxKeys.messages(conversationId),
        (existing) =>
          existing
            ? {
                ...existing,
                data: existing.data.map((m) =>
                  m.metadata?.clientMessageId === variables.clientMessageId
                    ? { ...m, pending: false, failed: true }
                    : m,
                ),
              }
            : existing,
      );
    },
  });
}

export function useConversationActions(conversationId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    void queryClient.invalidateQueries({ queryKey: inboxKeys.conversation(conversationId) });
  };

  return {
    close: useMutation({
      mutationFn: (resolution?: string) => closeConversation(conversationId, resolution),
      onSuccess: invalidate,
    }),
    reopen: useMutation({
      mutationFn: () => reopenConversation(conversationId),
      onSuccess: invalidate,
    }),
    assign: useMutation({
      mutationFn: (userId: string | null) => assignConversation(conversationId, userId),
      onSuccess: invalidate,
    }),
    takeOver: useMutation({
      mutationFn: () => takeOverConversation(conversationId),
      onSuccess: invalidate,
    }),
    returnToAi: useMutation({
      mutationFn: () => returnConversationToAi(conversationId),
      onSuccess: invalidate,
    }),
  };
}

export function useMarkConversationRead(conversationId: string | undefined, unread: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!conversationId || unread === 0) return;

    void markRead(conversationId)
      .then(() => queryClient.invalidateQueries({ queryKey: inboxKeys.all }))
      .catch(() => undefined);
  }, [conversationId, unread, queryClient]);
}

export function useAdminTypingEmitter(conversationId: string | undefined) {
  const { socket } = useSocket();
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef(0);

  const onInput = useCallback(() => {
    if (!socket || !conversationId) return;

    const now = Date.now();
    if (now - lastSent.current > 1_000) {
      socket.emit('typing:start', { conversationId });
      lastSent.current = now;
    }

    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId });
      lastSent.current = 0;
    }, 2_000);
  }, [socket, conversationId]);

  const stopNow = useCallback(() => {
    if (!socket || !conversationId) return;
    if (stopTimer.current) clearTimeout(stopTimer.current);
    socket.emit('typing:stop', { conversationId });
    lastSent.current = 0;
  }, [socket, conversationId]);

  useEffect(() => {
    return () => {
      if (stopTimer.current) clearTimeout(stopTimer.current);
    };
  }, []);

  return { onInput, stopNow };
}
