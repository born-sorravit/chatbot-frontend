'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocketEvent } from '@/lib/socket';
import { fetchNotifications } from './api';
import type { AppNotification } from '@/types/api';

export const notificationKeys = { all: ['notifications'] as const };

export function useNotifications() {
  const queryClient = useQueryClient();

  // Pushed live; the query is the source of truth and the socket only
  // invalidates it, matching the contract in ARCHITECTURE §2.3.
  useSocketEvent<AppNotification>('notification:new', () => {
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all });
  });

  return useQuery({
    queryKey: notificationKeys.all,
    queryFn: fetchNotifications,
    // Modest polling as a safety net for events missed while backgrounded;
    // the socket does the real work.
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
