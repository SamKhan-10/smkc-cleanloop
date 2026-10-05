import { useMemo, useState } from 'react';
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Navigation, ShieldCheck, LogOut, MapPin, Clock, ArrowLeft, Check, CheckCircle2, RotateCcw, Crosshair, ExternalLink, ClipboardCheck, Camera, BadgeCheck } from 'lucide-react';
import clsx from 'clsx';
import { useStore, useVerifier } from '../../lib/store';
import type { Complaint } from '../../lib/types';
import { haversineM, zoneById } from '../../lib/geo';
import { fmtCoord, fmtDateTime, fmtWhen, timeAgo } from '../../lib/format';
import { StaffAuth } from '../../components/StaffAuth';
import { LogoMark } from '../../components/Logo';
import { GeoCamera, type Capture } from '../../components/GeoCamera';
import { BeforeAfter } from '../../components/BeforeAfter';
import { EvidenceImage } from '../../components/EvidenceImage';
import { MapView } from '../../components/MapView';
import { Modal, EmptyState, Segmented } from '../../components/ui';
import { PriorityBadge, StatusBadge } from '../../components/badges';
import { toast } from '../../components/Toast';
import { useT } from '../../i18n';

function Shell({ children }: { children: React.ReactNode }) {
  const v = useVerifier()!;
  const logout = useStore((s) => s.logoutVerifier);
  return (
    <div className="min-h-screen bg-ink-100/60">
      <header className="sticky top-0 z-[1000] bg-violet-950 text-white">
        <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
          <Link to="/verifier" className="flex items-center gap-2">
            <LogoMark className="h-8 w-8" />
            <div className="leading-tight">
              <div className="font-display text-sm font-extrabold tracking-wide">FIELD VERIFIER</div>
              <div className="text-[10px] font-semibold text-violet-300">CivicSense · SMKC</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <span className="mono rounded-lg bg-white/10 px-2 py-1 text-xs font-bold">{v.staffId}</span>
            <button onClick={logout} className="rounded-lg p-2 hover:bg-white/10" aria-label="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-5 page-enter">{children}</main>
    </div>
  );
}

function NavigateModal({ c, onClose }: { c: Complaint | null; onClose: () => void }) {
  if (!c) return null;
  const depot = zoneById(c.zone).depot;
  const start = { lat: depot.lat + 0.002, lng: depot.lng + 0.002 };
  const d = haversineM(start, c) * 1.3;
  return (
    <Modal open={!!c} onClose={onClose} title={`Navigate · ${c.id}`}>
      <MapView className="h-72" complaints={[]} route={{ depot: { ...start, name: 'You' }, stops: [c] }} user={{ ...start, label: 'Your position (simulated)' }} legend={false} />
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-ink-50 p-3"><div className="font-display text-lg font-extrabold">{(d / 1000).toFixed(1)} km</div><div className="text-[10.5px] text-ink-500">distance</div></div>
        <div className="rounded-xl bg-ink-50 p-3"><div className="font-display text-lg font-extrabold">{Math.max(3, Math.round((d / 1000 / 20) * 60))} min</div><div className="text-[10.5px] text-ink-500">ETA (2-wheeler)</div></div>
        <div className="rounded-xl bg-ink-50 p-3"><div className="font-display text-lg font-extrabold">W{c.wardNo}</div><div className="text-[10.5px] text-ink-500">{c.locationName.replace('Near ', '')}</div></div>
      </div>
      <a href={`https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}`} target="_blank" rel="noreferrer" className="btn-primary mt-4 w-full">
        <ExternalLink className="h-4 w-4" /> Open turn-by-turn in Google Maps
      </a>
      <p className="mt-2 text-center text-[11px] text-ink-400">Route preview is simulated · destination {fmtCoord(c.lat, c.lng)}</p>
    </Modal>
  );
}

function Dashboard() {
  const v = useVerifier()!;
  const t = useT();
  const nav = useNavigate();
  const complaints = useStore((s) => s.complaints);
  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [tab, setTab] = useState<'pending' | 'done'>('pending');
  const [navC, setNavC] = useState<Complaint | null>(null);
  const pending = complaints.filter((c) => c.status === 'awaiting_verification' && (scope === 'all' || c.zone === v.zone)).sort((a, b) => a.updatedAt - b.updatedAt);
  const done = complaints.filter((c) => c.verification?.verifierId === v.staffId).sort((a, b) => b.verification!.at - a.verification!.at);
  const allPending = complaints.filter((c) => c.status === 'awaiting_verification').length;

  return (
    <Shell>
      <div className="rounded-2xl bg-gradient-to-br from-violet-700 to-violet-900 p-5 text-white shadow-lift">
        <div className="text-xs font-semibold uppercase tracking-wider text-violet-200">Ground Verifier · Ward {v.zone}</div>
        <div className="mt-1 font-display text-2xl font-extrabold">Assigned Verifications</div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-white/10 p-2.5"><div className="font-display text-2xl font-extrabold">{pending.length}</div><div className="text-[10.5px] text-violet-200">pending</div></div>
          <div className="rounded-xl bg-white/10 p-2.5"><div className="font-display text-2xl font-extrabold">{done.length}</div><div className="text-[10.5px] text-violet-200">verified by you</div></div>
          <div className="rounded-xl bg-white/10 p-2.5"><div className="font-display text-2xl font-extrabold">{allPending}</div><div className="text-[10.5px] text-violet-200">city-wide</div></div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Segmented value={tab} onChange={setTab} options={[{ value: 'pending', label: 'Pending', count: pending.length }, { value: 'done', label: 'Completed', count: done.length }]} />
        {tab === 'pending' && <Segmented value={scope} onChange={setScope} options={[{ value: 'mine', label: `Ward ${v.zone}` }, { value: 'all', label: 'All wards' }]} />}
      </div>

      <div className="mt-4 space-y-3">
        {tab === 'pending' &&
          (pending.length === 0 ? (
            <EmptyState icon={<ClipboardCheck className="h-5 w-5" />} title="No verifications pending" sub={scope === 'mine' ? `Nothing awaiting verification in Ward ${v.zone}. Try “All wards”.` : 'All cleaned sites have been verified.'} action={scope === 'mine' ? <button className="btn-secondary" onClick={() => setScope('all')}>Show all wards</button> : undefined} />
          ) : (
            pending.map((c) => (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-ink-200/70 bg-white shadow-card">
                <div className="flex gap-3 p-3.5">
                  <EvidenceImage src={c.evidence.image} alt="" className="h-20 w-24 shrink-0 rounded-xl" w={260} h={200} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="mono font-bold">{c.id}</span>
                      <PriorityBadge priority={c.priority} />
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-ink-500"><MapPin className="h-3.5 w-3.5" />Ward {c.wardNo} · <span className="truncate">{c.locationName}</span></div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className="chip bg-amber-50 text-amber-800 ring-amber-200 !text-[10px]">Cleanup Completed</span>
                      <span className="chip bg-violet-50 text-violet-700 ring-violet-200 !text-[10px]">Verification Pending</span>
                    </div>
                    <div className="mt-1 text-[11px] text-ink-400"><Clock className="mr-0.5 inline h-3 w-3" />Cleaned {timeAgo(c.updatedAt)}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 border-t border-ink-100">
                  <button onClick={() => setNavC(c)} className="flex items-center justify-center gap-1.5 py-3 text-sm font-bold text-ink-700 hover:bg-ink-50"><Navigation className="h-4 w-4" /> NAVIGATE</button>
                  <button onClick={() => nav(`/verifier/verify/${c.id}`)} className="flex items-center justify-center gap-1.5 bg-violet-700 py-3 text-sm font-bold text-white hover:bg-violet-800"><ShieldCheck className="h-4 w-4" /> VERIFY</button>
                </div>
              </div>
            ))
          ))}
        {tab === 'done' &&
          (done.length === 0 ? (
            <EmptyState icon={<BadgeCheck className="h-5 w-5" />} title="No verifications yet" sub="Completed verifications will appear here." />
          ) : (
            done.map((c) => (
              <Link key={c.id} to={`/issues/${c.id}`} className="flex items-center gap-3 rounded-2xl border border-ink-200/70 bg-white p-3 shadow-card">
                <EvidenceImage src={c.verification!.image} alt="" className="h-14 w-16 rounded-lg" w={200} h={150} />
                <div className="flex-1">
                  <div className="mono font-bold">{c.id}</div>
                  <div className="text-xs text-ink-500">Verified {fmtWhen(c.verification!.at)} · {c.verification!.distanceM} m from site</div>
                </div>
                <StatusBadge status={c.status} />
              </Link>
            ))
          ))}
      </div>
      <p className="mt-6 text-center text-[11px] text-ink-400">{t('home.noGallery')}</p>
      <NavigateModal c={navC} onClose={() => setNavC(null)} />
    </Shell>
  );
}

function VerifyFlow() {
  const { id } = useParams();
  const v = useVerifier()!;
  const nav = useNavigate();
  const c = useStore((s) => s.complaints.find((x) => x.id === id));
  const verify = useStore((s) => s.verifyComplaint);
  const reopen = useStore((s) => s.reopenComplaint);
  const [cap, setCap] = useState<Capture | null>(null);
  const [checks, setChecks] = useState({ clean: false, nolitter: false, area: false });
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);
  const [reopenOpen, setReopenOpen] = useState(false);
  const seed = useMemo(() => (c?.evidence.image.startsWith('scene:') ? Number(c.evidence.image.split(':')[2]) : c?.evidence.sceneSeed), [c]);

  if (!c) return <Shell><EmptyState icon={<Crosshair className="h-5 w-5" />} title="Complaint not found" action={<Link to="/verifier" className="btn-primary">Back</Link>} /></Shell>;
  const dist = cap ? Math.round(haversineM(cap, c)) : 0;
  const withinRange = dist <= 75;
  const allChecked = checks.clean && checks.nolitter && checks.area;

  if (done && c.verification)
    return (
      <Shell>
        <div className="overflow-hidden rounded-3xl bg-white text-center shadow-card">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 px-6 pb-8 pt-10 text-white">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-emerald-600 shadow-pop animate-pop"><Check className="h-10 w-10" strokeWidth={3} /></div>
            <div className="mt-4 font-display text-2xl font-extrabold">✓ Complaint Verified</div>
            <div className="mono mt-1 text-emerald-100">{c.id}</div>
          </div>
          <div className="space-y-4 p-5 text-left">
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">Status</div>
              <StatusBadge status={c.status} className="mt-1 !text-sm uppercase" />
            </div>
            <dl className="grid grid-cols-2 gap-3 rounded-2xl bg-ink-50 p-4 text-xs">
              <div><dt className="text-ink-400">Verifier ID</dt><dd className="mono font-bold">{c.verification.verifierId}</dd></div>
              <div><dt className="text-ink-400">Timestamp</dt><dd className="font-bold">{fmtDateTime(c.verification.at)}</dd></div>
              <div className="col-span-2"><dt className="text-ink-400">GPS</dt><dd className="mono font-bold">{fmtCoord(c.verification.lat, c.verification.lng)} · {c.verification.distanceM} m from site{c.verification.simulated ? ' · simulated' : ''}</dd></div>
            </dl>
            <EvidenceImage src={c.verification.image} alt="Verification" className="aspect-[4/3] w-full rounded-2xl" />
            <p className="text-center text-xs text-ink-500">Citizen <span className="mono font-semibold">{c.citizenId}</span> has been notified and invited to rate the resolution.</p>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/verifier" className="btn-primary">Next verification</Link>
              <Link to={`/issues/${c.id}`} className="btn-secondary">Public record</Link>
            </div>
          </div>
        </div>
      </Shell>
    );

  return (
    <Shell>
      <button onClick={() => (cap ? setCap(null) : nav('/verifier'))} className="btn-ghost -ml-3 mb-2"><ArrowLeft className="h-4 w-4" /> {cap ? 'Retake' : 'Back'}</button>
      {!cap ? (
        <>
          <div className="mb-3">
            <div className="text-xs font-bold uppercase tracking-wider text-violet-700">Capture Verification Photo</div>
            <h1 className="mono text-2xl font-extrabold">{c.id}</h1>
            <div className="text-sm text-ink-500">Ward {c.wardNo} · {c.locationName}</div>
          </div>
          <div className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card">
            <EvidenceImage src={c.evidence.image} alt="Before" className="h-14 w-16 rounded-lg" w={200} h={150} />
            <div className="text-xs text-ink-600"><b className="text-ink-900">Original evidence</b><br />Stand at the same spot and frame the same view.</div>
          </div>
          <GeoCamera mode="verifier" target={{ lat: c.lat, lng: c.lng }} sceneKind="clean" sceneSeed={seed} complaintId={c.id} verifierId={v.staffId} onCapture={setCap} />
        </>
      ) : (
        <div className="space-y-4 page-enter">
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-3 text-sm font-bold">Before / After</div>
            <BeforeAfter c={c} afterImage={cap.image} afterMeta={{ at: cap.capturedAt, lat: cap.lat, lng: cap.lng, by: v.staffId, distanceM: dist }} />
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-card">
            <div className={clsx('flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold', withinRange ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700')}>
              {withinRange ? <CheckCircle2 className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
              GPS check: {dist} m from complaint location {withinRange ? '(within 75 m ✓)' : '(too far — move closer)'}
            </div>
            <div className="mt-4 space-y-2">
              {(
                [
                  ['clean', 'Garbage completely removed from the site'],
                  ['nolitter', 'No residual litter or spillage nearby'],
                  ['area', 'Same location as the original evidence'],
                ] as const
              ).map(([k, l]) => (
                <label key={k} className={clsx('flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition', checks[k] ? 'border-emerald-400 bg-emerald-50/60' : 'border-ink-200')}>
                  <input type="checkbox" className="h-4 w-4 accent-emerald-600" checked={checks[k]} onChange={(e) => setChecks({ ...checks, [k]: e.target.checked })} />
                  {l}
                </label>
              ))}
            </div>
            <textarea className="input mt-3 resize-none" rows={2} placeholder="Verification notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button
              className="btn btn-lg mt-4 w-full bg-emerald-600 text-white hover:bg-emerald-700"
              disabled={!withinRange || !allChecked}
              onClick={() => {
                verify(c.id, { verifierId: v.staffId, at: cap.capturedAt, lat: cap.lat, lng: cap.lng, distanceM: dist, image: cap.image, simulated: cap.simulated, notes: notes || undefined });
                setDone(true);
                toast('Complaint verified', `${c.id} is now Verified Resolved. Citizen notified.`);
              }}
            >
              <ShieldCheck className="h-5 w-5" /> CONFIRM RESOLUTION
            </button>
            {!allChecked && <p className="mt-2 text-center text-[11px] text-ink-400">Complete the checklist to confirm.</p>}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button className="btn-secondary" onClick={() => setCap(null)}><Camera className="h-4 w-4" /> Retake</button>
              <button className="btn-secondary text-red-600" onClick={() => setReopenOpen(true)}><RotateCcw className="h-4 w-4" /> Not resolved</button>
            </div>
          </div>
        </div>
      )}
      <Modal open={reopenOpen} onClose={() => setReopenOpen(false)} title="Reopen complaint?">
        <p className="text-sm text-ink-600">The site is not clean. <b className="mono">{c.id}</b> will be sent back to the crew as In Progress and the citizen will be informed.</p>
        <textarea className="input mt-3 resize-none" rows={2} placeholder="Reason (e.g. residual waste behind the wall)" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <button
          className="btn-danger mt-4 w-full"
          onClick={() => {
            reopen(c.id, v.staffId, notes || 'Site not clean at verification');
            setReopenOpen(false);
            toast('Complaint reopened', `${c.id} returned to the crew.`, 'warn');
            nav('/verifier');
          }}
        >
          <RotateCcw className="h-4 w-4" /> Reopen for cleanup
        </button>
      </Modal>
    </Shell>
  );
}

export default function VerifierApp() {
  const v = useVerifier();
  if (!v) return <StaffAuth mode="verifier" />;
  return (
    <Routes>
      <Route index element={<Dashboard />} />
      <Route path="verify/:id" element={<VerifyFlow />} />
      <Route path="*" element={<Dashboard />} />
    </Routes>
  );
}
