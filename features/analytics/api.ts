'use client';

import { apiClient } from '@/lib/api-client';
import type { AiUsageReport, AnalyticsOverview, ApiEnvelope } from '@/types/api';

export async function fetchAnalyticsOverview(days: number): Promise<AnalyticsOverview> {
  const response = await apiClient.get<ApiEnvelope<AnalyticsOverview>>(
    `/admin/analytics/overview?days=${days}`,
  );
  return response.data;
}

export async function fetchAiUsage(days: number): Promise<AiUsageReport> {
  const response = await apiClient.get<ApiEnvelope<AiUsageReport>>(
    `/admin/analytics/ai-usage?days=${days}`,
  );
  return response.data;
}
