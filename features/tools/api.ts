'use client';

import { apiClient } from '@/lib/api-client';
import type { AiToolSummary, ApiEnvelope, ToolExecution, ToolExecutionStatus } from '@/types/api';

export async function fetchTools(): Promise<AiToolSummary[]> {
  const response = await apiClient.get<ApiEnvelope<AiToolSummary[]>>('/admin/tools');
  return response.data;
}

export async function fetchToolExecutions(filters: {
  status?: ToolExecutionStatus;
  conversationId?: string;
} = {}): Promise<ToolExecution[]> {
  const query = new URLSearchParams({ limit: '50' });
  if (filters.status) query.set('status', filters.status);
  if (filters.conversationId) query.set('conversationId', filters.conversationId);

  const response = await apiClient.get<ApiEnvelope<ToolExecution[]>>(
    `/admin/tool-executions?${query}`,
  );
  return response.data;
}

export async function approveToolExecution(id: string): Promise<ToolExecution> {
  const response = await apiClient.post<ApiEnvelope<ToolExecution>>(
    `/admin/tool-executions/${id}/approve`,
  );
  return response.data;
}

export async function rejectToolExecution(id: string, reason?: string): Promise<ToolExecution> {
  const response = await apiClient.post<ApiEnvelope<ToolExecution>>(
    `/admin/tool-executions/${id}/reject`,
    reason ? { reason } : {},
  );
  return response.data;
}
