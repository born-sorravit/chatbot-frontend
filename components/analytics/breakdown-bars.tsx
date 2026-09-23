'use client';

import { motion } from 'motion/react';

export interface BreakdownRow {
  label: string;
  value: number;
  /** Optional right-aligned annotation, e.g. a cost or a percentage. */
  note?: string;
}

/**
 * Horizontal proportion bars for a small categorical breakdown.
 *
 * Bars are scaled against the largest row rather than the total, so a
 * long tail stays readable instead of collapsing into slivers.
 */
export function BreakdownBars({ rows, empty }: { rows: BreakdownRow[]; empty: string }) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-sm">{empty}</p>;
  }

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <div className="space-y-2.5">
      {rows.map((row, index) => (
        <div key={row.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate">{row.label}</span>
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {row.note ?? row.value}
            </span>
          </div>
          <div className="bg-muted h-1.5 overflow-hidden rounded-full">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.value / max) * 100}%` }}
              transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
              className="bg-primary h-full rounded-full"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
