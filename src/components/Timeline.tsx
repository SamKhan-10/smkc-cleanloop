import { Check } from 'lucide-react';
import clsx from 'clsx';
import type { Complaint } from '../lib/types';
import { useT } from '../i18n';
import { fmtWhen } from '../lib/format';

const STAGES = [
  { key: 'id.t.submitted', event: 'submitted' },
  { key: 'id.t.location', event: 'location_verified' },
  { key: 'id.t.ward', event: 'ward_identified' },
  { key: 'id.t.assigned', event: 'routed' },
  { key: 'id.t.cleanup', event: 'cleanup_started' },
  { key: 'id.t.verification', event: 'verification_queued' },
  { key: 'id.t.resolved', event: 'verified' },
];

function stageState(c: Complaint): number {
  // number of completed stages
  switch (c.status) {
    case 'pending': return 3;
    case 'assigned': return 4;
    case 'in_progress': return 4;
    case 'cleanup_completed':
    case 'awaiting_verification': return 5;
    case 'verified_resolved': return 7;
  }
}

export function Timeline({ c, dark }: { c: Complaint; dark?: boolean }) {
  const t = useT();
  const done = stageState(c);
  const active = c.status === 'in_progress' ? 4 : c.status === 'awaiting_verification' || c.status === 'cleanup_completed' ? 5 : c.status === 'pending' ? 3 : -1;
  const lastAt = (event: string) => [...c.history].reverse().find((h) => h.event === event)?.at;
  return (
    <ol className="relative">
      {STAGES.map((s, i) => {
        const isDone = i < done;
        const isActive = i === active;
        const at = isDone ? lastAt(s.event) : undefined;
        return (
          <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
            {i < STAGES.length - 1 && (
              <span className={clsx('absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5', i < done - 1 || (isDone && isActive) ? 'bg-emerald-400' : isDone ? 'bg-emerald-400' : dark ? 'bg-white/10' : 'bg-ink-200')} />
            )}
            <span
              className={clsx(
                'relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition',
                isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-amber-500 text-white' : dark ? 'bg-ink-800 text-ink-400 ring-1 ring-white/10' : 'bg-white text-ink-400 ring-2 ring-ink-200',
              )}
            >
              {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : isActive ? <span className="h-2.5 w-2.5 rounded-full bg-white" /> : <span className="h-2 w-2 rounded-full bg-current opacity-50" />}
              {isActive && <span className="cl-pulse bg-amber-400" />}
            </span>
            <div className="pt-0.5">
              <div className={clsx('text-sm font-semibold', isDone ? (dark ? 'text-white' : 'text-ink-900') : isActive ? 'text-amber-600' : dark ? 'text-ink-500' : 'text-ink-400')}>{t(s.key)}</div>
              <div className={clsx('text-xs', dark ? 'text-ink-400' : 'text-ink-500')}>
                {at ? fmtWhen(at) : isActive ? (c.status === 'pending' ? 'Awaiting ward review' : 'In progress now') : ''}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export const EVENT_LABEL: Record<string, string> = {
  submitted: 'Report submitted with geo-tagged camera evidence',
  location_verified: 'GPS location verified',
  ward_identified: 'Ward identified from coordinates',
  ai_validated: 'Evidence validated (garbage detection, duplicate & hotspot checks)',
  review_queued: 'Queued for ward review (possible duplicate)',
  routed: 'Assigned to municipal team',
  crew_assigned: 'Field crew assigned',
  route_added: 'Added to optimized collection route',
  cleanup_started: 'Cleanup started',
  cleanup_completed: 'Cleanup marked completed by crew',
  verification_queued: 'Queued for independent ground verification',
  verified: 'Ground verification passed — Verified Resolved',
  reopened: 'Reopened after verification',
  escalated: 'Escalated by municipal officer',
  feedback: 'Citizen feedback received',
};

export function AuditTrail({ c, dark }: { c: Complaint; dark?: boolean }) {
  return (
    <ul className="space-y-3">
      {[...c.history].reverse().map((h, i) => (
        <li key={i} className="flex gap-3 text-sm">
          <span className={clsx('mt-1.5 h-2 w-2 shrink-0 rounded-full', h.event === 'verified' ? 'bg-emerald-500' : h.event === 'reopened' || h.event === 'escalated' ? 'bg-red-500' : 'bg-brand-400')} />
          <div className="min-w-0 flex-1">
            <div className={clsx('font-medium', dark ? 'text-ink-100' : 'text-ink-800')}>
              {EVENT_LABEL[h.event] ?? h.event}
              {h.note && <span className={clsx('ml-1 font-normal', dark ? 'text-ink-400' : 'text-ink-500')}>· {h.note}</span>}
            </div>
            <div className={clsx('mono text-[11px]', dark ? 'text-ink-500' : 'text-ink-400')}>
              {fmtWhen(h.at)} · {h.by}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
