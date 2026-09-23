'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Minimal switch built on a checkbox input.
 *
 * A native checkbox rather than a Radix primitive: it works with React Hook
 * Form's `register` without a Controller, and this form has two of them.
 */
function Switch({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center', className)}>
      <input type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="bg-input peer-checked:bg-primary peer-focus-visible:ring-ring/50 relative h-5 w-9 rounded-full transition-colors peer-focus-visible:ring-[3px] after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:after:translate-x-4"
      />
    </label>
  );
}

export { Switch };
