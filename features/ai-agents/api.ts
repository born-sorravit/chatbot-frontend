'use client';

import { apiClient } from '@/lib/api-client';
import type { AiAgent, AiAgentTestResult, ApiEnvelope } from '@/types/api';

export async function fetchAgents(): Promise<AiAgent[]> {
  const response = await apiClient.get<ApiEnvelope<AiAgent[]>>('/admin/ai-agents');
  return response.data;
}

export async function fetchAgent(id: string): Promise<AiAgent> {
  const response = await apiClient.get<ApiEnvelope<AiAgent>>(`/admin/ai-agents/${id}`);
  return response.data;
}

export async function updateAgent(id: string, patch: Partial<AiAgent>): Promise<AiAgent> {
  const response = await apiClient.patch<ApiEnvelope<AiAgent>>(`/admin/ai-agents/${id}`, patch);
  return response.data;
}

export async function testAgent(id: string, message: string): Promise<AiAgentTestResult> {
  const response = await apiClient.post<ApiEnvelope<AiAgentTestResult>>(
    `/admin/ai-agents/${id}/test`,
    { message },
  );
  return response.data;
}
