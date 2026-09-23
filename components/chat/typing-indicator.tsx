'use client';

import * as motion from 'motion/react-client';

export function TypingIndicator({ name }: { name?: string | null }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-1"
    >
      <div className="bg-muted flex items-center gap-1 rounded-2xl rounded-bl-sm px-3 py-2.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            className="bg-muted-foreground/60 size-1.5 rounded-full"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: index * 0.15 }}
          />
        ))}
      </div>
      {name && <span className="text-muted-foreground text-xs">{name} กำลังพิมพ์...</span>}
    </motion.div>
  );
}
