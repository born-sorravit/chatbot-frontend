'use client';

import * as motion from 'motion/react-client';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  /** Shown under the value — sample size, or why the value is missing. */
  hint?: string;
  loading?: boolean;
  index?: number;
  accent?: 'default' | 'positive' | 'warning';
}

const ACCENT: Record<NonNullable<StatCardProps['accent']>, string> = {
  default: 'bg-primary/10 text-primary',
  positive: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  loading,
  index = 0,
  accent = 'default',
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      // Staggered by position so a row of cards resolves left to right
      // instead of flashing in all at once.
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Card className="h-full">
        <CardContent className="flex items-start gap-3 p-4">
          <div className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg', ACCENT[accent])}>
            <Icon className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-muted-foreground truncate text-xs">{label}</p>
            {loading ? (
              <Skeleton className="mt-1.5 h-6 w-16" />
            ) : (
              <p className="text-xl font-semibold tabular-nums">{value}</p>
            )}
            {hint && !loading && (
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-tight">{hint}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
