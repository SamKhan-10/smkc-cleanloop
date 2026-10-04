import clsx from 'clsx';
import { Flame } from 'lucide-react';
import type { Priority, Status } from '../lib/types';
import { PRIORITY_TONE, STATUS_DOT, STATUS_PROGRESS, STATUS_TONE } from '../lib/status';
import { useT } from '../i18n';

export function StatusBadge({ status, className }: { status: Status; className?: string }) {
  const t = useT();
  return (
    <span className={clsx('chip', STATUS_TONE[status], className)}>
      <span className={clsx('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {t(`status.${status}`)}
    </span>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const t = useT();
  return (
    <span className={clsx('chip uppercase tracking-wide !text-[10px]', PRIORITY_TONE[priority], className)}>
      {priority === 'critical' && <Flame className="h-3 w-3" />}
      {t(`priority.${priority}`)}
    </span>
  );
}

export function HotspotBadge({ className }: { className?: string }) {
  const t = useT();
  return <span className={clsx('chip bg-red-600 text-white ring-red-600 !text-[10px] uppercase tracking-wide', className)}>🚨 {t('filter.hotspots')}</span>;
}

export function ProgressBar({ status, className }: { status: Status; className?: string }) {
  const p = STATUS_PROGRESS[status];
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
        <div
          className={clsx('h-full rounded-full transition-all duration-700', p === 100 ? 'bg-emerald-500' : p >= 60 ? 'bg-amber-500' : 'bg-sky-500')}
          style={{ width: `${p}%` }}
        />
      </div>
      <span className="w-9 text-right text-xs font-semibold tabular-nums text-ink-600">{p}%</span>
    </div>
  );
}
