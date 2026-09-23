'use client';

import * as motion from 'motion/react-client';
import { WifiOff } from 'lucide-react';
import type { ConnectionState } from '@/lib/socket';

/**
 * Connection status (master plan §50).
 *
 * Only shown when something is wrong — a persistent "connected" badge is
 * noise, but a silent disconnect makes the app look broken.
 */
export function ConnectionBanner({ state }: { state: ConnectionState }) {
  if (state === 'connected') {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="bg-amber-500/10 text-amber-700 dark:text-amber-400"
      role="status"
    >
      <div className="flex items-center justify-center gap-2 px-3 py-1.5 text-xs">
        <WifiOff className="size-3.5" />
        {state === 'connecting' ? 'กำลังเชื่อมต่อ...' : 'ขาดการเชื่อมต่อ กำลังลองใหม่...'}
      </div>
    </motion.div>
  );
}
