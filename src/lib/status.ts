import type { Priority, Status } from './types';

export const STATUS_PROGRESS: Record<Status, number> = {
  pending: 15,
  assigned: 40,
  in_progress: 60,
  cleanup_completed: 75,
  awaiting_verification: 85,
  verified_resolved: 100,
};

export type Bucket = 'pending' | 'in_progress' | 'resolved';
export const bucketOf = (s: Status): Bucket =>
  s === 'pending' || s === 'assigned' ? 'pending' : s === 'verified_resolved' ? 'resolved' : 'in_progress';

export const STATUS_TONE: Record<Status, string> = {
  pending: 'bg-ink-100 text-ink-700 ring-ink-200',
  assigned: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  cleanup_completed: 'bg-amber-50 text-amber-800 ring-amber-200',
  awaiting_verification: 'bg-violet-50 text-violet-700 ring-violet-200',
  verified_resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
};

export const STATUS_DOT: Record<Status, string> = {
  pending: 'bg-ink-400',
  assigned: 'bg-sky-500',
  in_progress: 'bg-amber-500',
  cleanup_completed: 'bg-amber-500',
  awaiting_verification: 'bg-violet-500',
  verified_resolved: 'bg-emerald-500',
};

export const PRIORITY_COLOR: Record<Priority, string> = {
  critical: '#dc2626',
  high: '#ea7a12',
  medium: '#e3b008',
  low: '#64748b',
};
export const RESOLVED_COLOR = '#16a34a';

export const PRIORITY_TONE: Record<Priority, string> = {
  critical: 'bg-red-50 text-red-700 ring-red-200',
  high: 'bg-orange-50 text-orange-700 ring-orange-200',
  medium: 'bg-yellow-50 text-yellow-800 ring-yellow-200',
  low: 'bg-ink-50 text-ink-600 ring-ink-200',
};

export const PRIORITY_RANK: Record<Priority, number> = { critical: 4, high: 3, medium: 2, low: 1 };

export const ZONE_COLOR: Record<string, string> = { A: '#2a78d6', B: '#eb6834', C: '#1baf7a', D: '#eda100' };
