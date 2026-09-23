'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export interface DailyPoint {
  date: string;
  value: number;
  /** Shown in the tooltip beneath the value. */
  secondary?: string;
}

interface DailyChartProps {
  points: DailyPoint[];
  /** Formats the value for the tooltip and the max label. */
  format: (value: number) => string;
  label: string;
}

/**
 * Daily bar chart, hand-rolled in SVG-free markup.
 *
 * No charting library: the project ships shadcn on Radix and motion.dev, and
 * pulling in Recharts (and its D3 dependencies) to draw one series of bars
 * would outweigh this component several times over. Reconsider if the
 * dashboard ever needs axes, zooming or combo charts.
 *
 * Bars are sized in percentages rather than a fixed viewBox so the chart
 * reflows with its container instead of scaling its stroke widths and text.
 */
export function DailyChart({ points, format, label }: DailyChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const max = useMemo(() => Math.max(...points.map((p) => p.value), 0), [points]);

  if (points.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
    );
  }

  // A flat zero series would otherwise divide by zero and render full-height
  // bars, reading as maximum traffic when there was none.
  const scale = max > 0 ? max : 1;

  return (
    <div className="w-full">
      <div className="text-muted-foreground mb-2 flex items-baseline justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums">สูงสุด {format(max)}</span>
      </div>

      <div className="flex h-36 items-end gap-[2px]" onMouseLeave={() => setHovered(null)}>
        {points.map((point, index) => (
          <div
            key={point.date}
            className="relative flex h-full flex-1 cursor-default items-end"
            onMouseEnter={() => setHovered(index)}
          >
            {/* Full-height hit area: a 2px-tall bar on a quiet day is
                otherwise almost impossible to point at. */}
            <div className="absolute inset-0" aria-hidden />

            <motion.div
              initial={{ height: 0 }}
              animate={{
                height: `${Math.max((point.value / scale) * 100, point.value > 0 ? 3 : 1.5)}%`,
              }}
              transition={{ duration: 0.35, delay: index * 0.012, ease: 'easeOut' }}
              className={cn(
                'w-full rounded-t-[3px] transition-colors',
                point.value > 0 ? 'bg-primary' : 'bg-muted',
                hovered === index && point.value > 0 && 'bg-primary/70',
              )}
            />

            {hovered === index && (
              // Anchored to the hovered column, not the chart, so it points at
              // the bar it describes. `min-w-max` keeps it on one line and
              // the clamped translate keeps the edge columns' tooltips from
              // overflowing the card.
              <div
                className={cn(
                  'bg-popover text-popover-foreground pointer-events-none absolute bottom-full z-10 mb-1 min-w-max rounded-md border px-2.5 py-1.5 text-xs shadow-md',
                  index === 0 && 'left-0',
                  index === points.length - 1 && 'right-0',
                  index > 0 && index < points.length - 1 && 'left-1/2 -translate-x-1/2',
                )}
              >
                <p className="font-medium tabular-nums">{format(point.value)}</p>
                <p className="text-muted-foreground tabular-nums">{point.date}</p>
                {point.secondary && <p className="text-muted-foreground">{point.secondary}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="text-muted-foreground mt-1.5 flex justify-between text-[11px] tabular-nums">
        <span>{points[0].date}</span>
        <span>{points.at(-1)?.date}</span>
      </div>
    </div>
  );
}
