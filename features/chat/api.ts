'use client';

import { apiClient } from '@/lib/api-client';
import type {
  ApiEnvelope,
  ChatSession,
  CursorEnvelope,
  CustomerConversation,
  CustomerMessage,
} from '@/types/api';

export async function startSession(input: {
  organizationSlug: string;
  name?: string;
}): Promise<ChatSession> {
  const response = await apiClient.post<ApiEnvelope<ChatSession>>('/chat/sessions', input, {
    skipRefresh: true,
  });
  return response.data;
}

export async function fetchConversation(): Promise<CustomerConversation> {
  const response = await apiClient.get<ApiEnvelope<CustomerConversation>>('/chat/conversation', {
    skipRefresh: true,
  });
  return response.data;
}

export async function fetchMessages(before?: string): Promise<CursorEnvelope<CustomerMessage>> {
  const query = new URLSearchParams({ limit: '50' });
  if (before) query.set('before', before);

  return apiClient.get<CursorEnvelope<CustomerMessage>>(`/chat/messages?${query}`, {
    skipRefresh: true,
  });
}

export async function sendMessage(input: {
  content: string;
  clientMessageId: string;
}): Promise<CustomerMessage> {
  const response = await apiClient.post<ApiEnvelope<CustomerMessage>>('/chat/messages', input, {
    skipRefresh: true,
  });
  return response.data;
}

export async function requestHuman(): Promise<CustomerConversation> {
  const response = await apiClient.post<ApiEnvelope<CustomerConversation>>(
    '/chat/request-human',
    undefined,
    { skipRefresh: true },
  );
  return response.data;
}

export async function markRead(): Promise<void> {
  await apiClient.post<void>('/chat/read', undefined, { skipRefresh: true });
}
