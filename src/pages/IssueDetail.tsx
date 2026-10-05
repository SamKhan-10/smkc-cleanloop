import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Clock, UserRound, Users, Crosshair, Siren, BellRing, ChevronDown, ShieldCheck, Hash } from 'lucide-react';
import { useT } from '../i18n';
import { useCitizen, useStore } from '../lib/store';
import { CREWS } from '../lib/seed';
import { fmtCoord, fmtDateTime, fmtWhen } from '../lib/format';
import { PriorityBadge, ProgressBar, StatusBadge } from '../components/badges';
import { EvidenceImage } from '../components/EvidenceImage';
import { Timeline, AuditTrail } from '../components/Timeline';
import { BeforeAfter } from '../components/BeforeAfter';
import { FeedbackForm } from '../components/FeedbackForm';
import { AiPanel } from '../components/AiPanel';
import { MapView } from '../components/MapView';
import { EmptyState } from '../components/ui';

export default function IssueDetail() {
  const { id } = useParams();
  const t = useT();
  const nav = useNavigate();
  const c = useStore((s) => s.complaints.find((x) => x.id === id));
  const hotspot = useStore((s) => s.hotspots.find((h) => id && h.complaintIds.includes(id)));
  const citizen = useCitizen();
  const [audit, setAudit] = useState(false);

  if (!c)
    return (
      <div className="container-x py-16">
        <EmptyState icon={<Hash className="h-5 w-5" />} title={t('id.notFound')} action={<Link to="/live" className="btn-primary">{t('nav.live')}</Link>} />
      </div>
    );

  const isOwner = citizen?.citizenId === c.citizenId;
  const crew = CREWS.find((k) => k.id === c.crewId);
  const resolved = c.status === 'verified_resolved';

  return (
    <div className="container-x py-6 sm:py-10">
      <button onClick={() => (history.length > 1 ? nav(-1) : nav('/live'))} className="btn-ghost -ml-3 mb-3">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">{t(`type.${c.type}`)}</div>
          <h1 className="mono mt-0.5 text-3xl font-extrabold">{c.id}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.citizenSeverity} prefix={t('rp.severity')} />
            {hotspot && <span className="chip bg-red-600 text-white ring-red-600 !text-[10px] uppercase">🚨 Repeat hotspot · {hotspot.id}</span>}
            {c.demo && <span className="chip bg-amber-50 text-amber-800 ring-amber-200 !text-[10px]">DEMO RECORD</span>}
          </div>
        </div>
        <div className="w-full max-w-xs">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400">{t('common.progress')}</div>
          <ProgressBar status={c.status} />
        </div>
      </div>

      {isOwner && resolved && (
        <div className="mt-5 flex gap-3 rounded-2xl bg-emerald-600 p-4 text-white shadow-lift page-enter">
          <BellRing className="h-6 w-6 shrink-0" />
          <div>
            <div className="font-bold">🔔 {t('nt.resolved', { id: c.id })}</div>
            <div className="text-sm text-emerald-50">{t('nt.resolvedSub')}</div>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.45fr_1fr]">
        <div className="space-y-6">
          <div className="card p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold">{resolved ? 'Before / After verification' : t('id.evidence')}</div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Camera-captured · GPS-tagged</span>
            </div>
            {resolved && c.verification ? (
              <BeforeAfter c={c} />
            ) : (
              <div className="relative overflow-hidden rounded-2xl bg-black">
                <EvidenceImage src={c.evidence.image} alt={`Evidence for ${c.id}`} className="aspect-[4/3] w-full" />
              </div>
            )}
            <div className="mt-4">
              <div className="label">{t('common.description')}</div>
              <p className="text-[15px] leading-relaxed text-ink-700">{c.description}</p>
            </div>
          </div>

          {isOwner && resolved && <FeedbackForm c={c} />}

          <div className="card p-4 sm:p-5">
            <AiPanel ai={c.ai} priority={c.priority} showPriority={false} />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3">
              <div className="text-sm font-bold">{t('common.location')}</div>
              <span className="mono text-xs text-ink-500">{fmtCoord(c.lat, c.lng)}</span>
            </div>
            <MapView className="h-72 rounded-none border-0" complaints={[c]} hotspots={hotspot ? [hotspot] : []} focus={{ lat: c.lat, lng: c.lng, zoom: 16 }} highlightId={c.id} legend={false} citizenView />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                [UserRound, t('common.citizen'), <span className="mono">{c.citizenId}</span>],
                [MapPin, t('common.ward'), `${t('common.ward')} ${c.wardNo} · Zone ${c.zone}`],
                [Crosshair, t('common.location'), c.locationName],
                [Clock, t('cd.submitted'), fmtDateTime(c.createdAt)],
                [Users, 'Municipal team', crew ? `${crew.name}` : `Zone ${c.zone} office`],
                [Clock, t('common.lastUpdated'), fmtWhen(c.updatedAt)],
              ].map(([I, k, v], i) => {
                const Icon = I as typeof Clock;
                return (
                  <div key={i}>
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400"><Icon className="h-3 w-3" /> {k as string}</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">{v as React.ReactNode}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 flex items-start gap-1.5 rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-600" /> Citizen identity is protected. Only the anonymous Citizen ID is shown.
            </p>
          </div>

          <div className="card p-5">
            <div className="mb-4 text-sm font-bold">{t('id.timeline')}</div>
            <Timeline c={c} />
          </div>

          {hotspot && (
            <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
              <div className="flex items-center gap-2 text-sm font-bold text-red-700"><Siren className="h-4 w-4" /> Repeat hotspot area</div>
              <p className="mt-1 text-xs text-red-800/80">
                {hotspot.complaintIds.length} verified incidents within 150 m at {hotspot.locationName}. The municipal team has been alerted for root-cause investigation.
              </p>
            </div>
          )}

          <div className="card p-5">
            <button className="flex w-full items-center justify-between text-sm font-bold" onClick={() => setAudit((a) => !a)}>
              {t('id.auditTrail')} <ChevronDown className={`h-4 w-4 transition ${audit ? 'rotate-180' : ''}`} />
            </button>
            {audit && <div className="mt-4 page-enter"><AuditTrail c={c} /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
