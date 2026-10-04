import { Link } from 'react-router-dom';
import { MapPin, Clock, UserRound, ArrowRight, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import type { Complaint } from '../lib/types';
import { useT } from '../i18n';
import { fmtWhen } from '../lib/format';
import { PriorityBadge, ProgressBar, StatusBadge } from './badges';
import { EvidenceImage } from './EvidenceImage';

export function IssueCard({ c, hotspot, to, isNew }: { c: Complaint; hotspot?: boolean; to?: string; isNew?: boolean }) {
  const t = useT();
  return (
    <article
      className={clsx(
        'group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-lift',
        hotspot ? 'border-red-200' : 'border-ink-100',
        isNew && 'ring-2 ring-brand-400',
      )}
    >
      <div className="relative h-28 overflow-hidden bg-ink-100">
        <EvidenceImage src={c.status === 'verified_resolved' && c.verification ? c.verification.image : c.evidence.image} alt={`Evidence for ${c.id}`} className="h-full w-full transition duration-500 group-hover:scale-105" w={400} h={220} />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-2.5">
          <span className="rounded-md bg-ink-950/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur">{t(`type.${c.type}`)}</span>
          <PriorityBadge priority={c.priority} className="!bg-white/95" />
        </div>
        {hotspot && (
          <span className="absolute bottom-2 left-2.5 rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">🚨 {t('filter.hotspots')}</span>
        )}
        {isNew && <span className="absolute bottom-2 right-2.5 rounded-md bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">New</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{t('common.issueId')}</div>
            <div className="mono text-[15px] font-bold text-ink-900">{c.id}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">{t('common.citizen')}</div>
            <div className="mono flex items-center gap-1 text-[13px] font-semibold text-ink-700">
              <UserRound className="h-3.5 w-3.5 text-ink-400" />
              {c.citizenId}
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1.5 text-xs text-ink-600">
          <span className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            <span className="truncate">
              <b className="font-semibold text-ink-800">{t('common.ward')} {c.wardNo}</b> · {c.locationName}
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-ink-400" />
            {t('common.reported')} {fmtWhen(c.createdAt)}
          </span>
        </div>
        <div className="mt-3">
          <StatusBadge status={c.status} />
        </div>
        <ProgressBar status={c.status} className="mt-3" />
        <div className="mt-3 flex items-center justify-between border-t border-ink-100 pt-3">
          <span className="flex min-w-0 items-center gap-1 truncate text-[11px] text-ink-500">
            <RefreshCw className="h-3 w-3 shrink-0" />
            {t('common.lastUpdated')} {fmtWhen(c.updatedAt)}
          </span>
          <Link to={to ?? `/issues/${c.id}`} className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-brand-700 hover:bg-brand-50">
            {t('common.viewDetails')}
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
