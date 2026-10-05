import { Star } from 'lucide-react';
import clsx from 'clsx';
import type { StatusLevel } from '../lib/wardStatus';

/** Shows only the earned stars (3–5) — a status, not a score out of five. */
export function StatusStars({ level, size = 'h-5 w-5', className }: { level: StatusLevel; size?: string; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-0.5', className)} role="img" aria-label={`${level} stars`}>
      {Array.from({ length: level }).map((_, i) => (
        <Star key={i} className={clsx(size, 'fill-amber-400 text-amber-400')} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export const LEVEL_TONE: Record<StatusLevel, { dot: string; text: string; bg: string; ring: string }> = {
  5: { dot: 'bg-emerald-500', text: 'text-emerald-800', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  4: { dot: 'bg-teal-500', text: 'text-teal-800', bg: 'bg-teal-50', ring: 'ring-teal-200' },
  3: { dot: 'bg-amber-500', text: 'text-amber-800', bg: 'bg-amber-50', ring: 'ring-amber-200' },
};
