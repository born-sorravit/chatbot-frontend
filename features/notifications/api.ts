'use client';

import { apiClient } from '@/lib/api-client';
import type { NotificationsEnvelope } from '@/types/api';

export async function fetchNotifications(): Promise<NotificationsEnvelope> {
  return apiClient.get<NotificationsEnvelope>('/admin/notifications?limit=20');
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post<void>(`/admin/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post<void>('/admin/notifications/read-all');
}
