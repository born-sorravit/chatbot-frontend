'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createChannel, deleteChannel, fetchChannels, updateChannel } from './api';
import { ApiError } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth.store';
import { Permission, type ChannelIntegrationInput } from '@/types/api';

const KEY = ['channels'];

/**
 * Channel integrations, gated on the same permission the endpoint requires.
 *
 * `enabled` rather than an unconditional fetch: the nav link is hidden from an
 * AGENT, but navigating to /channels directly would otherwise fire a request
 * that always 403s — a console error and a retry storm for a page they cannot
 * use. The server gate is what protects the data; this keeps the client from
 * asking.
 */
export function useChannels() {
  const canRead = useAuthStore((state) => state.hasPermission(Permission.SettingsRead));

  const query = useQuery({ queryKey: KEY, queryFn: fetchChannels, enabled: canRead });

  return { ...query, canRead };
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEY });
}

/** Surfaces the backend's message rather than a generic one — a missing
 *  credential names the exact key, which is the whole value of the error. */
function describe(error: unknown): string {
  return error instanceof ApiError ? error.message : 'ดำเนินการไม่สำเร็จ';
}

export function useCreateChannel() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (input: ChannelIntegrationInput) => createChannel(input),
    onSuccess: () => {
      toast.success('เชื่อมต่อช่องทางเรียบร้อย');
      void invalidate();
    },
    onError: (error) => toast.error(describe(error)),
  });
}

export function useUpdateChannel() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<Omit<ChannelIntegrationInput, 'channel'>>;
    }) => updateChannel(id, input),
    onSuccess: () => {
      toast.success('บันทึกแล้ว');
      void invalidate();
    },
    onError: (error) => toast.error(describe(error)),
  });
}

export function useDeleteChannel() {
  const invalidate = useInvalidate();

  return useMutation({
    mutationFn: (id: string) => deleteChannel(id),
    onSuccess: () => {
      toast.success('ยกเลิกการเชื่อมต่อแล้ว');
      void invalidate();
    },
    onError: (error) => toast.error(describe(error)),
  });
}
