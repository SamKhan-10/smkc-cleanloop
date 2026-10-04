import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Siren, ClipboardCheck, UserCog, CalendarClock, CheckCircle2, FileText, Send, Cctv, Scale, Camera, MapPin, History, ShieldCheck, Eye, Lightbulb } from 'lucide-react';
import clsx from 'clsx';
import { useStaff, useStore } from '../../lib/store';
import { OFFICER_BY_ZONE } from '../../lib/seed';
import { fmtDate, fmtWhen, timeAgo, fmtCoord } from '../../lib/format';
import { MapView } from '../../components/MapView';
import { StatusBadge } from '../../components/badges';
import { EvidenceImage } from '../../components/EvidenceImage';
import { Modal, EmptyState, DemoTag } from '../../components/ui';
import { toast } from '../../components/Toast';
import { HS_STATUS, ROOT_CAUSES, isPersistent, recommendedAction } from './hotspotMeta';
import { Panel } from './shared';

const DAY = 86400000;

export default function HotspotDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const staff = useStaff()!;
  const h = useStore((s) => s.hotspots.find((x) => x.id === id));
  const complaints = useStore((s) => s.complaints);
  const update = useStore((s) => s.updateHotspot);
  const addEnf = useStore((s) => s.addEnforcement);
  const [notice, setNotice] = useState(false);
  const [notes, setNotes] = useState(h?.investigation.notes ?? '');
  const [causes, setCauses] = useState<string[]>(h?.investigation.causes ?? []);
  const [root, setRoot] = useState(h?.investigation.rootCause ?? '');
  const [officer, setOfficer] = useState(h?.investigation.assignedOfficer ?? '');
  const [follow, setFollow] = useState(h?.investigation.followUpDate ?? new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10));

  if (!h) return <EmptyState icon={<Siren className="h-5 w-5" />} title="Hotspot not found" action={<Link className="btn-primary" to="/municipal/hotspots">All hotspots</Link>} />;

  const incidents = h.complaintIds.map((cid) => complaints.find((c) => c.id === cid)!).filter(Boolean).sort((a, b) => b.createdAt - a.createdAt);
  const verifiedCount = incidents.filter((c) => c.verification).length;
  const lastAt = incidents[0]?.createdAt ?? h.detectedAt;
  const st = HS_STATUS[h.status];
  const rootMeta = ROOT_CAUSES.find((r) => r.key === root);
  const sinceAction = h.actionAt ? incidents.filter((c) => c.createdAt > h.actionAt!).length : 0;
  const officers = Array.from(new Set([OFFICER_BY_ZONE[h.zone], staff.staffId, 'WO-' + h.zone + '02', 'FS-' + h.zone + '11']));
  const by = staff.staffId;
  const enfDone = (k: string) => h.enforcement.find((e) => e.kind === k);
  const stepIdx = { detected: 0, investigating: 1, action_assigned: 2, monitoring: 3 }[h.status];

  const save = (patch: Partial<typeof h.investigation>, extra?: Partial<typeof h>) => update(h.id, { investigation: { ...h.investigation, notes, causes, ...patch }, ...extra });

  return (
    <div>
      <button onClick={() => nav(-1)} className="btn-ghost -ml-3 mb-2"><ArrowLeft className="h-4 w-4" /> Back</button>

      <div className={clsx('overflow-hidden rounded-3xl text-white shadow-lift', h.status === 'monitoring' ? 'bg-gradient-to-br from-emerald-700 to-emerald-900' : 'bg-gradient-to-br from-red-600 to-red-800')}>
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-extrabold tracking-[0.14em] text-white/80">
              {h.status === 'monitoring' ? <Eye className="h-4 w-4" /> : <Siren className="h-4 w-4 animate-pulse" />}
              {h.status === 'monitoring' ? 'REPEAT HOTSPOT · MONITORING' : '🚨 REPEAT HOTSPOT DETECTED'} · {h.id}
            </div>
            <h1 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{h.locationName}</h1>
            <div className="mt-1 text-sm text-white/80">Ward {h.wardNo} · Ward Office {h.zone} · {fmtCoord(h.lat, h.lng)}</div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-white/15 px-4 py-2.5"><div className="font-display text-2xl font-extrabold">{h.complaintIds.length}</div><div className="text-[10px] uppercase tracking-wider text-white/80">Verified incidents</div></div>
            <div className="rounded-2xl bg-white/15 px-4 py-2.5"><div className="font-display text-lg font-extrabold">{timeAgo(lastAt)}</div><div className="text-[10px] uppercase tracking-wider text-white/80">Last occurrence</div></div>
            <div className="rounded-2xl bg-white/15 px-4 py-2.5"><div className="font-display text-sm font-extrabold leading-6">{recommendedAction(h)}</div><div className="text-[10px] uppercase tracking-wider text-white/80">Recommended</div></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 bg-black/15 px-5 py-3 sm:px-6">
          {['Detected', 'Investigation', 'Corrective Action', 'Monitoring'].map((s, i) => (
            <span key={s} className={clsx('flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold', i <= stepIdx ? 'bg-white text-ink-900' : 'bg-white/10 text-white/70')}>
              {i < stepIdx ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <span className="text-[10px]">{i + 1}</span>} {s}
            </span>
          ))}
          <span className={clsx('ml-auto rounded-full px-3 py-1 text-xs font-bold', st.tone)}>Status: {st.label}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.1fr]">
        <div className="space-y-5">
          <Panel className="overflow-hidden">
            <MapView className="h-72 rounded-none border-0" complaints={incidents} hotspots={[h]} focus={{ lat: h.lat, lng: h.lng, zoom: 16 }} linkBase="/municipal/complaints/" legend={false} />
          </Panel>
          <Panel className="p-4">
            <div className="mb-3 flex items-center gap-2 font-bold"><History className="h-4 w-4" /> Incident history <span className="text-xs font-medium text-ink-400">· within 150 m</span></div>
            <div className="space-y-2.5">
              {incidents.map((c) => (
                <Link key={c.id} to={`/municipal/complaints/${c.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-ink-50">
                  <EvidenceImage src={c.evidence.image} alt="" className="h-12 w-16 shrink-0 rounded-lg" w={200} h={150} />
                  <div className="min-w-0 flex-1">
                    <div className="mono text-sm font-bold">{c.id} {h.actionAt && c.createdAt > h.actionAt && <span className="ml-1 rounded bg-red-100 px-1 text-[9px] font-bold text-red-700">AFTER ACTION</span>}</div>
                    <div className="text-xs text-ink-500">{fmtWhen(c.createdAt)} · {c.citizenId}</div>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-5">
          {/* FIELD INVESTIGATION */}
          <Panel className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-lg font-extrabold"><ClipboardCheck className="h-5 w-5 text-brand-700" /> FIELD INVESTIGATION</div>
              {h.investigation.startedAt && <span className="text-[11px] text-ink-400">Started {fmtDate(h.investigation.startedAt)}</span>}
            </div>
            <div className="label mt-4">Possible root causes</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROOT_CAUSES.map((r) => (
                <label key={r.key} className={clsx('flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition', causes.includes(r.key) ? 'border-brand-500 bg-brand-50 font-semibold' : 'border-ink-200 hover:border-ink-300')}>
                  <input type="checkbox" className="accent-brand-700" checked={causes.includes(r.key)} onChange={(e) => setCauses(e.target.checked ? [...causes, r.key] : causes.filter((x) => x !== r.key))} />
                  {r.label}
                </label>
              ))}
            </div>
            <label className="label mt-4" htmlFor="notes">Investigation notes</label>
            <textarea id="notes" rows={3} className="input resize-none" placeholder="Residents reported irregular collection timing in the area." value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button
              className="btn-secondary mt-2"
              onClick={() => {
                save({ startedAt: h.investigation.startedAt ?? Date.now() }, h.status === 'detected' ? { status: 'investigating' } : undefined);
                toast('Investigation saved', `${h.id} · ${causes.length} possible cause(s) recorded.`, 'info');
              }}
            >
              <ClipboardCheck className="h-4 w-4" /> {h.status === 'detected' ? 'Start investigation' : 'Save notes'}
            </button>

            <div className="mt-5 rounded-2xl bg-ink-50 p-4 ring-1 ring-ink-100">
              <div className="text-xs font-extrabold uppercase tracking-wider text-ink-700">Root cause identified</div>
              <select className="input mt-2" value={root} onChange={(e) => setRoot(e.target.value)}>
                <option value="">Select root cause…</option>
                {(causes.length ? ROOT_CAUSES.filter((r) => causes.includes(r.key)) : ROOT_CAUSES).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
              {rootMeta && (
                <div className="mt-3 flex gap-2 rounded-xl bg-white p-3 text-sm ring-1 ring-ink-100 page-enter">
                  <Lightbulb className="h-5 w-5 shrink-0 text-amber-500" />
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Recommended corrective action</div>
                    <div className="font-semibold text-ink-900">“{rootMeta.action}”</div>
                  </div>
                </div>
              )}
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label">Assign officer</label>
                  <select className="input" value={officer} onChange={(e) => setOfficer(e.target.value)}>
                    <option value="">Select…</option>
                    {officers.map((o) => <option key={o} value={o}>{o}{o === staff.staffId ? ' (you)' : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Follow-up date</label>
                  <input type="date" className="input" value={follow} onChange={(e) => setFollow(e.target.value)} />
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  className="btn-primary"
                  disabled={!root}
                  onClick={() => {
                    save({ rootCause: root, correctiveAction: rootMeta?.action, assignedOfficer: officer || OFFICER_BY_ZONE[h.zone], followUpDate: follow, startedAt: h.investigation.startedAt ?? Date.now() }, { status: 'action_assigned' });
                    toast('Corrective action created', rootMeta?.action);
                  }}
                >
                  <FileText className="h-4 w-4" /> Create Corrective Action
                </button>
                <button className="btn-secondary" disabled={!officer} onClick={() => { save({ assignedOfficer: officer }); toast('Officer assigned', `${officer} → ${h.id}`, 'info'); }}>
                  <UserCog className="h-4 w-4" /> Assign Officer
                </button>
                <button className="btn-secondary" onClick={() => { save({ followUpDate: follow }); toast('Follow-up scheduled', fmtDate(new Date(follow).getTime()), 'info'); }}>
                  <CalendarClock className="h-4 w-4" /> Set Follow-up Date
                </button>
                <button
                  className="btn-accent"
                  disabled={!h.investigation.correctiveAction && !root}
                  onClick={() => {
                    save({ rootCause: root || h.investigation.rootCause, correctiveAction: h.investigation.correctiveAction ?? rootMeta?.action, assignedOfficer: officer || h.investigation.assignedOfficer || OFFICER_BY_ZONE[h.zone], followUpDate: follow, completedAt: Date.now() }, { status: 'monitoring', actionAt: Date.now() });
                    toast('Investigation complete', `${h.locationName} is now under continuous monitoring.`);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Investigation Complete
                </button>
              </div>
              {h.investigation.correctiveAction && (
                <div className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900 ring-1 ring-sky-200">
                  Active corrective action: <b>{h.investigation.correctiveAction}</b>{h.investigation.assignedOfficer && <> · Officer <span className="mono">{h.investigation.assignedOfficer}</span></>}{h.investigation.followUpDate && <> · Follow-up {fmtDate(new Date(h.investigation.followUpDate).getTime())}</>}
                </div>
              )}
            </div>
          </Panel>

          {h.status === 'monitoring' && (
            <Panel className="p-5">
              <div className="flex items-center gap-2 font-bold"><Eye className="h-4 w-4 text-emerald-600" /> Continuous monitoring</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-emerald-50 p-3"><div className="font-display text-2xl font-extrabold text-emerald-700">{Math.floor((Date.now() - (h.actionAt ?? Date.now())) / DAY)}</div><div className="text-[10.5px] text-emerald-900/70">days since action</div></div>
                <div className={clsx('rounded-xl p-3', sinceAction ? 'bg-red-50' : 'bg-emerald-50')}><div className={clsx('font-display text-2xl font-extrabold', sinceAction ? 'text-red-600' : 'text-emerald-700')}>{sinceAction}</div><div className="text-[10.5px] text-ink-600">recurrences</div></div>
                <div className="rounded-xl bg-ink-50 p-3"><div className="font-display text-sm font-extrabold leading-8">{h.investigation.followUpDate ? fmtDate(new Date(h.investigation.followUpDate).getTime()) : '—'}</div><div className="text-[10.5px] text-ink-500">next follow-up</div></div>
              </div>
              <p className="mt-3 text-xs text-ink-500">Any new verified complaint within 150 m automatically reopens this hotspot for investigation.</p>
            </Panel>
          )}

          {/* ENFORCEMENT */}
          {isPersistent(h) && (
            <Panel className="overflow-hidden border-amber-300">
              <div className="flex items-center gap-2 bg-amber-500 px-5 py-2.5 text-sm font-extrabold tracking-wider text-white">
                <Scale className="h-4 w-4" /> ENFORCEMENT ALERT
              </div>
              <div className="p-5">
                <p className="text-sm font-semibold text-ink-800">Verified enforcement support as per applicable municipal rules.</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  {[
                    [Camera, 'Evidence collected', `${incidents.length} geo-tagged photos`],
                    [History, 'Incident history', `${incidents.length} incidents since ${fmtDate(incidents[incidents.length - 1].createdAt)}`],
                    [MapPin, 'Location', `${h.locationName}, Ward ${h.wardNo}`],
                    [Siren, 'Repeat count', `${h.complaintIds.length} within 150 m`],
                    [ShieldCheck, 'Verification records', `${verifiedCount} ground-verified closures`],
                  ].map(([I, k, v]) => {
                    const Icon = I as typeof Camera;
                    return (
                      <div key={k as string} className="rounded-xl bg-ink-50 p-3">
                        <div className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-400"><Icon className="h-3 w-3" /> {k as string}</div>
                        <div className="mt-0.5 text-xs font-semibold text-ink-800">{v as string}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid gap-2">
                  <button className="btn-secondary justify-start" onClick={() => setNotice(true)}>
                    <FileText className="h-4 w-4" /> Generate Notice Recommendation {enfDone('notice') && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
                  </button>
                  <button className="btn-secondary justify-start" disabled={!!enfDone('review')} onClick={() => { addEnf(h.id, 'review', by); toast('Forwarded for municipal review', `${h.id} evidence package sent to Ward ${h.zone} administration.`, 'info'); }}>
                    <Send className="h-4 w-4" /> Forward for Municipal Review {enfDone('review') && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
                  </button>
                  <button className="btn-secondary h-auto justify-start !whitespace-normal py-3 text-left" disabled={!!enfDone('surveillance')} onClick={() => { addEnf(h.id, 'surveillance', by); toast('Surveillance recommendation recorded', 'Subject to municipal approval.', 'info'); }}>
                    <Cctv className="h-4 w-4 shrink-0" />
                    <span>Recommend Surveillance Deployment<span className="block text-[11px] font-medium text-ink-500">Surveillance camera deployment recommendation · Subject to municipal approval.</span></span>
                    {enfDone('surveillance') && <CheckCircle2 className="ml-auto h-4 w-4 shrink-0 text-emerald-600" />}
                  </button>
                </div>
                {h.enforcement.length > 0 && (
                  <ul className="mt-4 space-y-1 border-t border-ink-100 pt-3 text-xs text-ink-600">
                    {h.enforcement.map((e, i) => (
                      <li key={i}>• {e.kind === 'notice' ? 'Notice recommendation generated' : e.kind === 'review' ? 'Forwarded for municipal review' : 'Surveillance deployment recommended (pending approval)'} — <span className="mono">{e.by}</span>, {fmtWhen(e.at)}</li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-[11px] text-ink-400">CleanLoop provides evidence support only. No fines or deployments are issued automatically; all actions require municipal review and approval.</p>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <Modal open={notice} onClose={() => setNotice(false)} title="Notice Recommendation (draft)" wide>
        <div className="flex items-center justify-between">
          <DemoTag label="Draft · for municipal review" />
          <span className="mono text-xs text-ink-400">REF CL/{h.id}/{new Date().getFullYear()}</span>
        </div>
        <div className="mt-4 space-y-3 rounded-2xl border border-ink-200 bg-ink-50/50 p-5 text-sm leading-relaxed text-ink-700">
          <p><b>Subject:</b> Recommendation for notice — repeated waste dumping at {h.locationName}, Ward {h.wardNo}</p>
          <p>CleanLoop has recorded <b>{h.complaintIds.length} geo-verified incidents</b> within a 150 m radius of {fmtCoord(h.lat, h.lng)} between {fmtDate(incidents[incidents.length - 1].createdAt)} and {fmtDate(incidents[0].createdAt)}. {verifiedCount} incidents were cleaned and independently verified by ground verifiers.</p>
          <p><b>Identified root cause:</b> {ROOT_CAUSES.find((r) => r.key === (root || h.investigation.rootCause))?.label ?? 'Under investigation'}.</p>
          <p>It is recommended that the competent authority review the attached evidence and, if found appropriate, issue a notice to the responsible party as per applicable municipal rules.</p>
          <p className="text-xs text-ink-500">Evidence package: {incidents.map((c) => c.id).join(', ')}. Citizen identities are withheld (Citizen IDs only).</p>
          <p className="text-xs text-ink-500">Prepared by {by} · {fmtDate(Date.now())}</p>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn-secondary flex-1" onClick={() => setNotice(false)}>Close</button>
          <button className="btn-primary flex-1" onClick={() => { if (!enfDone('notice')) addEnf(h.id, 'notice', by); setNotice(false); toast('Notice recommendation recorded', 'Forward for municipal review to proceed.', 'info'); }}>
            <FileText className="h-4 w-4" /> Record recommendation
          </button>
        </div>
      </Modal>
    </div>
  );
}
