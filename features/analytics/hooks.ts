'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchAiUsage, fetchAnalyticsOverview } from './api';
import { useAuthStore } from '@/stores/auth.store';
import { Permission } from '@/types/api';

export function useAnalyticsOverview(days: number) {
  return useQuery({
    queryKey: ['analytics', 'overview', days],
    queryFn: () => fetchAnalyticsOverview(days),
  });
}

/**
 * Cost report, mirroring the backend's stricter gate.
 *
 * `enabled` on the permission rather than just hiding the panel: an AGENT has
 * `conversation.read` but not `settings.read`, so an unconditional query
 * would fire a request that always 403s — a red console entry and a retry
 * storm for a panel the user is never shown. The server gate is what actually
 * protects the data; this only keeps the client from asking.
 */
export function useAiUsage(days: number) {
  const canReadCost = useAuthStore((state) => state.hasPermission(Permission.SettingsRead));

  const query = useQuery({
    queryKey: ['analytics', 'ai-usage', days],
    queryFn: () => fetchAiUsage(days),
    enabled: canReadCost,
  });

  return { ...query, canReadCost };
}
