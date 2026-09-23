'use client';

import * as motion from 'motion/react-client';
import { AlertCircle, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageSenderType } from '@/types/api';

interface MessageBubbleProps {
  content: string | null;
  senderType: MessageSenderType;
  senderName?: string | null;
  createdAt: string;
  /** True when this side of the conversation sent it. */
  own: boolean;
  pending?: boolean;
  failed?: boolean;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({
  content,
  senderType,
  senderName,
  createdAt,
  own,
  pending,
  failed,
}: MessageBubbleProps) {
  // SYSTEM messages are bookkeeping, not conversation — centred and muted so
  // they read as events rather than as something a person said.
  if (senderType === MessageSenderType.System) {
    return (
      <div className="flex justify-center py-1">
        <span className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs">
          {content}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={cn('flex w-full', own ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('flex max-w-[78%] flex-col gap-1', own && 'items-end')}>
        {!own && senderName && (
          <span className="text-muted-foreground px-1 text-xs">{senderName}</span>
        )}

        <div
          className={cn(
            'rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap',
            own
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm',
            failed && 'border-destructive border',
          )}
        >
          {content}
        </div>

        <div className="text-muted-foreground flex items-center gap-1 px-1 text-[11px]">
          <span>{formatTime(createdAt)}</span>
          {own && pending && <Clock className="size-3" aria-label="กำลังส่ง" />}
          {own && failed && (
            <AlertCircle className="text-destructive size-3" aria-label="ส่งไม่สำเร็จ" />
          )}
          {own && !pending && !failed && <Check className="size-3" aria-label="ส่งแล้ว" />}
        </div>
      </div>
    </motion.div>
  );
}
