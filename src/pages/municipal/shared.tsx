import type { ReactNode } from 'react';
import clsx from 'clsx';
import type { Complaint, ZoneId } from '../../lib/types';
import { bucketOf } from '../../lib/status';

export function KpiCard({ label, value, tone, icon, sub }: { label: string; value: ReactNode; tone: string; icon: ReactNode; sub?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-200/60 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-500">{label}</span>
        <span className={clsx('grid h-8 w-8 place-items-center rounded-lg', tone)}>{icon}</span>
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold tabular-nums text-ink-900">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-ink-500">{sub}</div>}
    </div>
  );
}

export function PageHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-ink-500">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function zoneStats(complaints: Complaint[], zone: ZoneId | null, hotspotCount: number) {
  const cs = zone ? complaints.filter((c) => c.zone === zone) : complaints;
  return {
    total: cs.length,
    pending: cs.filter((c) => bucketOf(c.status) === 'pending').length,
    inProgress: cs.filter((c) => bucketOf(c.status) === 'in_progress').length,
    resolved: cs.filter((c) => bucketOf(c.status) === 'resolved').length,
    hotspots: hotspotCount,
  };
}

export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={clsx('rounded-2xl border border-ink-200/60 bg-white shadow-card', className)}>{children}</div>
);
