'use client';

import { apiClient } from '@/lib/api-client';
import type { ApiEnvelope, ChannelIntegration, ChannelIntegrationInput } from '@/types/api';

export async function fetchChannels(): Promise<ChannelIntegration[]> {
  const response = await apiClient.get<ApiEnvelope<ChannelIntegration[]>>('/admin/channels');
  return response.data;
}

export async function createChannel(input: ChannelIntegrationInput): Promise<ChannelIntegration> {
  const response = await apiClient.post<ApiEnvelope<ChannelIntegration>>('/admin/channels', input);
  return response.data;
}

export async function updateChannel(
  id: string,
  input: Partial<Omit<ChannelIntegrationInput, 'channel'>>,
): Promise<ChannelIntegration> {
  const response = await apiClient.patch<ApiEnvelope<ChannelIntegration>>(
    `/admin/channels/${id}`,
    input,
  );
  return response.data;
}

export async function deleteChannel(id: string): Promise<void> {
  await apiClient.delete(`/admin/channels/${id}`);
}
