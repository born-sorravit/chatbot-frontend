'use client';

import { apiClient } from '@/lib/api-client';
import type {
  AdminMessage,
  ApiEnvelope,
  ConversationDetail,
  CursorEnvelope,
  InboxItem,
  PaginatedEnvelope,
} from '@/types/api';

export interface InboxFilters {
  status?: string;
  mode?: string;
  assignedUserId?: string;
  search?: string;
  page?: number;
}

export async function fetchInbox(filters: InboxFilters): Promise<PaginatedEnvelope<InboxItem>> {
  const query = new URLSearchParams({ limit: '30', page: String(filters.page ?? 1) });
  if (filters.status) query.set('status', filters.status);
  if (filters.mode) query.set('mode', filters.mode);
  if (filters.assignedUserId) query.set('assignedUserId', filters.assignedUserId);
  if (filters.search) query.set('search', filters.search);

  return apiClient.get<PaginatedEnvelope<InboxItem>>(`/admin/conversations?${query}`);
}

export async function fetchConversation(id: string): Promise<ConversationDetail> {
  const response = await apiClient.get<ApiEnvelope<ConversationDetail>>(
    `/admin/conversations/${id}`,
  );
  return response.data;
}

export async function fetchMessages(id: string, before?: string) {
  const query = new URLSearchParams({ limit: '50' });
  if (before) query.set('before', before);
  return apiClient.get<CursorEnvelope<AdminMessage>>(
    `/admin/conversations/${id}/messages?${query}`,
  );
}

export async function reply(id: string, input: { content: string; clientMessageId: string }) {
  const response = await apiClient.post<ApiEnvelope<AdminMessage>>(
    `/admin/conversations/${id}/messages`,
    input,
  );
  return response.data;
}

export async function markRead(id: string) {
  return apiClient.post<ApiEnvelope<InboxItem>>(`/admin/conversations/${id}/read`);
}

export async function closeConversation(id: string, resolution?: string) {
  return apiClient.post<ApiEnvelope<InboxItem>>(
    `/admin/conversations/${id}/close`,
    resolution ? { resolution } : {},
  );
}

export async function reopenConversation(id: string) {
  return apiClient.post<ApiEnvelope<InboxItem>>(`/admin/conversations/${id}/reopen`);
}

export async function takeOverConversation(id: string) {
  return apiClient.post<ApiEnvelope<InboxItem>>(`/admin/conversations/${id}/takeover`);
}

export async function returnConversationToAi(id: string) {
  return apiClient.post<ApiEnvelope<InboxItem>>(`/admin/conversations/${id}/return-to-ai`);
}

export async function assignConversation(id: string, userId: string | null) {
  return apiClient.post<ApiEnvelope<InboxItem>>(`/admin/conversations/${id}/assign`, { userId });
}
