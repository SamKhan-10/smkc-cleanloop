import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, PlayCircle, CheckCheck, Route as RouteIcon, AlertTriangle, History, MapPin, Clock, UserRound, Crosshair, Siren, Check, Truck, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { useStaff, useStore } from '../../lib/store';
import type { Status } from '../../lib/types';
import { CREWS } from '../../lib/seed';
import { fmtCoord, fmtDateTime, fmtWhen } from '../../lib/format';
import { haversineM } from '../../lib/geo';
import { PriorityBadge, StatusBadge } from '../../components/badges';
import { EvidenceImage } from '../../components/EvidenceImage';
import { MapView } from '../../components/MapView';
import { AiPanel } from '../../components/AiPanel';
import { AuditTrail } from '../../components/Timeline';
import { BeforeAfter } from '../../components/BeforeAfter';
import { Modal, EmptyState } from '../../components/ui';
import { toast } from '../../components/Toast';
import { useT } from '../../i18n';
import { Panel } from './shared';

const FLOW: { s: Status; label: string }[] = [
  { s: 'pending', label: 'Pending' },
  { s: 'assigned', label: 'Assigned' },
  { s: 'in_progress', label: 'In Progress' },
  { s: 'cleanup_completed', label: 'Cleanup Completed' },
  { s: 'awaiting_verification', label: 'Awaiting Verification' },
  { s: 'verified_resolved', label: 'Verified Resolved' },
];

export default function ComplaintManage() {
  const { id } = useParams();
  const t = useT();
  const nav = useNavigate();
  const staff = useStaff()!;
  const c = useStore((s) => s.complaints.find((x) => x.id === id));
  const hotspot = useStore((s) => s.hotspots.find((h) => id && h.complaintIds.includes(id)));
  const { assignCrew, startCleanup, completeCleanup, escalate } = useStore();
  const [assignOpen, setAssignOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [escOpen, setEscOpen] = useState(false);
  const [crewSel, setCrewSel] = useState('');

  if (!c) return <EmptyState icon={<Crosshair className="h-5 w-5" />} title="Complaint not found" action={<Link className="btn-primary" to="/municipal/complaints">All complaints</Link>} />;

  const idx = FLOW.findIndex((f) => f.s === c.status);
  const crew = CREWS.find((k) => k.id === c.crewId);
  const zoneCrews = CREWS.filter((k) => k.zone === c.zone);
  const otherCrews = CREWS.filter((k) => k.zone !== c.zone);
  const resolved = c.status === 'verified_resolved';
  const canAssign = c.status === 'pending' || c.status === 'assigned';
  const canStart = c.status === 'pending' || c.status === 'assigned';
  const canComplete = c.status === 'in_progress';
  const by = staff.staffId;

  const actions = [
    { label: 'Assign Team', icon: Users, onClick: () => { setCrewSel(c.crewId ?? zoneCrews[0].id); setAssignOpen(true); }, disabled: !canAssign, tone: 'btn-secondary', hint: c.crewId ? `Currently: ${crew?.name}` : 'No crew assigned yet' },
    { label: 'Start Cleanup', icon: PlayCircle, onClick: () => { startCleanup(c.id, by); toast('Cleanup started', `${c.id} is now In Progress.`, 'info'); }, disabled: !canStart, tone: 'btn-warn', hint: 'Crew begins on-site cleanup' },
    { label: 'Mark Cleanup Completed', icon: CheckCheck, onClick: () => { completeCleanup(c.id, by); toast('Sent for ground verification', `${c.id} queued for an independent verifier.`); }, disabled: !canComplete, tone: 'btn-primary', hint: 'Queues independent ground verification' },
    { label: 'Optimize Route', icon: RouteIcon, onClick: () => nav(`/municipal/routes?anchor=${c.id}`), disabled: resolved, tone: 'btn-secondary', hint: 'Group with nearby open issues' },
    { label: c.escalated ? 'Escalated' : 'Escalate', icon: AlertTriangle, onClick: () => setEscOpen(true), disabled: resolved || c.escalated, tone: 'btn-secondary', hint: 'Raise priority & notify ward officer' },
    { label: 'View History', icon: History, onClick: () => setHistoryOpen(true), disabled: false, tone: 'btn-secondary', hint: `${c.history.length} audit entries` },
  ];

  return (
    <div>
      <button onClick={() => nav(-1)} className="btn-ghost -ml-3 mb-2"><ArrowLeft className="h-4 w-4" /> Back</button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-ink-500">{t(`type.${c.type}`)}</div>
          <h1 className="mono text-3xl font-extrabold">{c.id}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={c.status} />
            <PriorityBadge priority={c.priority} />
            {c.escalated && <span className="chip bg-red-50 text-red-700 ring-red-200">Escalated</span>}
            {hotspot && <Link to={`/municipal/hotspots/${hotspot.id}`} className="chip bg-red-600 text-white ring-red-600">🚨 Repeat hotspot · {hotspot.id}</Link>}
          </div>
        </div>
      </div>

      {/* workflow */}
      <Panel className="mt-5 overflow-x-auto p-4">
        <div className="flex min-w-[720px] items-center">
          {FLOW.map((f, i) => (
            <div key={f.s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5 text-center">
                <span className={clsx('grid h-8 w-8 place-items-center rounded-full text-xs font-bold', i < idx || resolved ? 'bg-emerald-500 text-white' : i === idx ? 'bg-brand-700 text-white ring-4 ring-brand-100' : 'bg-ink-100 text-ink-400')}>
                  {i < idx || resolved ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                </span>
                <span className={clsx('w-24 text-[11px] font-semibold leading-tight', i <= idx ? 'text-ink-800' : 'text-ink-400')}>{f.label}</span>
              </div>
              {i < FLOW.length - 1 && <span className={clsx('mx-1 mb-5 h-0.5 flex-1 rounded', i < idx ? 'bg-emerald-400' : 'bg-ink-200')} />}
            </div>
          ))}
        </div>
      </Panel>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold">{resolved ? 'Before / After' : 'Before image · citizen evidence'}</div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700"><ShieldCheck className="h-3.5 w-3.5" /> Live camera · GPS ±{c.evidence.accuracy} m</span>
            </div>
            {resolved && c.verification ? <BeforeAfter c={c} /> : <EvidenceImage src={c.evidence.image} alt="Before" className="aspect-[4/3] w-full rounded-xl" />}
            <div className="mt-4">
              <div className="label">Description</div>
              <p className="text-ink-700">{c.description}</p>
            </div>
          </Panel>
          <Panel className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="text-sm font-bold">Location</div>
              <span className="mono text-xs text-ink-500">{fmtCoord(c.lat, c.lng)}</span>
            </div>
            <MapView className="h-80 rounded-none border-0" complaints={[c]} hotspots={hotspot ? [hotspot] : []} crews={zoneCrews} showDepots focus={{ lat: c.lat, lng: c.lng, zoom: 15 }} highlightId={c.id} onSelect={() => undefined} />
          </Panel>
          <Panel className="p-4"><AiPanel ai={c.ai} priority={c.priority} /></Panel>
        </div>

        <div className="space-y-5">
          <Panel className="p-4">
            <div className="mb-3 text-sm font-bold">Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {actions.map((a) => (
                <button key={a.label} onClick={a.onClick} disabled={a.disabled} className={clsx(a.tone, 'h-auto !flex-col !items-start !gap-1 !whitespace-normal !py-3 text-left')}>
                  <span className="flex items-center gap-1.5 uppercase tracking-wide"><a.icon className="h-4 w-4" /> {a.label}</span>
                  <span className="text-[10.5px] font-medium normal-case opacity-70">{a.hint}</span>
                </button>
              ))}
            </div>
            {c.status === 'awaiting_verification' && (
              <div className="mt-3 rounded-xl bg-violet-50 p-3 text-xs text-violet-800 ring-1 ring-violet-200">
                Awaiting independent ground verification. A Ground Verifier will capture a fresh geo-tagged photo before this complaint can be closed. <Link to="/verifier" className="font-bold underline">Open Field Verifier →</Link>
              </div>
            )}
          </Panel>
          <Panel className="p-4">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                [UserRound, 'Citizen ID', <span className="mono">{c.citizenId}</span>],
                [MapPin, 'Ward', `Ward ${c.wardNo} · Office ${c.zone}`],
                [Crosshair, 'Location', c.locationName],
                [Clock, 'Reported', fmtDateTime(c.createdAt)],
                [Truck, 'Team', crew ? `${crew.name} (${crew.vehicle})` : 'Ward Office queue'],
                [Clock, 'Last update', fmtWhen(c.updatedAt)],
              ].map(([I, k, v], i) => {
                const Icon = I as typeof Clock;
                return (
                  <div key={i}>
                    <dt className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-ink-400"><Icon className="h-3 w-3" />{k as string}</dt>
                    <dd className="mt-0.5 font-semibold text-ink-800">{v as React.ReactNode}</dd>
                  </div>
                );
              })}
            </dl>
            <p className="mt-4 rounded-xl bg-ink-50 px-3 py-2 text-[11px] text-ink-500"><ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-brand-600" />Citizen name, email and phone are not visible to municipal staff.</p>
          </Panel>
          {c.verification && (
            <Panel className="p-4">
              <div className="mb-2 text-sm font-bold">Verification record</div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div><dt className="text-ink-400">Verifier ID</dt><dd className="mono font-semibold">{c.verification.verifierId}</dd></div>
                <div><dt className="text-ink-400">Timestamp</dt><dd className="font-semibold">{fmtDateTime(c.verification.at)}</dd></div>
                <div><dt className="text-ink-400">GPS</dt><dd className="mono font-semibold">{fmtCoord(c.verification.lat, c.verification.lng)}</dd></div>
                <div><dt className="text-ink-400">Distance from site</dt><dd className="font-semibold">{c.verification.distanceM} m</dd></div>
              </dl>
              {c.feedback && <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Citizen feedback: {'★'.repeat(c.feedback.rating)}{'☆'.repeat(5 - c.feedback.rating)}</div>}
            </Panel>
          )}
          <Panel className="p-4">
            <div className="mb-3 flex items-center justify-between text-sm font-bold">Recent activity <button className="text-xs font-semibold text-brand-700" onClick={() => setHistoryOpen(true)}>Full history</button></div>
            <AuditTrail c={{ ...c, history: c.history.slice(-5) }} />
          </Panel>
        </div>
      </div>

      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign team · ${c.id}`}>
        <div className="space-y-2">
          {[...zoneCrews, ...otherCrews].map((k) => {
            const d = haversineM(k, c);
            const load = useStore.getState().complaints.filter((x) => x.crewId === k.id && x.status !== 'verified_resolved').length;
            return (
              <label key={k.id} className={clsx('flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition', crewSel === k.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300')}>
                <input type="radio" className="accent-brand-700" checked={crewSel === k.id} onChange={() => setCrewSel(k.id)} />
                <Truck className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-semibold">{k.name} <span className="text-xs font-normal text-ink-500">· {k.vehicle} · {k.members} members</span></div>
                  <div className="text-xs text-ink-500">Ward {k.zone} · {(d / 1000).toFixed(1)} km away · {load} open tasks</div>
                </div>
                {k.zone === c.zone && <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">SAME WARD</span>}
              </label>
            );
          })}
        </div>
        <button
          className="btn-primary mt-4 w-full"
          onClick={() => {
            assignCrew(c.id, crewSel, by);
            setAssignOpen(false);
            toast('Team assigned', `${CREWS.find((k) => k.id === crewSel)?.name} → ${c.id}`);
          }}
        >
          <Users className="h-4 w-4" /> Assign Team
        </button>
      </Modal>

      <Modal open={escOpen} onClose={() => setEscOpen(false)} title="Escalate complaint?">
        <p className="text-sm text-ink-600">Escalating <b className="mono">{c.id}</b> raises its priority one level and flags it for the Ward {c.zone} officer. This action is recorded in the audit trail under <b className="mono">{by}</b>.</p>
        <div className="mt-5 flex gap-2">
          <button className="btn-secondary flex-1" onClick={() => setEscOpen(false)}>Cancel</button>
          <button className="btn-danger flex-1" onClick={() => { escalate(c.id, by); setEscOpen(false); toast('Complaint escalated', `${c.id} priority raised.`, 'warn'); }}>
            <Siren className="h-4 w-4" /> Escalate
          </button>
        </div>
      </Modal>

      <Modal open={historyOpen} onClose={() => setHistoryOpen(false)} title={`History · ${c.id}`}>
        <AuditTrail c={c} />
      </Modal>
    </div>
  );
}
