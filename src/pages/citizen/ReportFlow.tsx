import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, MapPin, Clock, Crosshair, RotateCcw, ScanSearch, ShieldCheck, ArrowRight, Siren, Map as MapIcon, Camera, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { useT } from '../../i18n';
import { useCitizen, useStore } from '../../lib/store';
import type { Complaint, Hotspot, IssueType, Severity } from '../../lib/types';
import { analyze, scoreToPriority } from '../../lib/ai';
import { fmtCoord, fmtTime, fmtDateTime } from '../../lib/format';
import { GeoCamera, type Capture } from '../../components/GeoCamera';
import { CitizenGate } from '../../components/CitizenAuth';
import { AiPanel } from '../../components/AiPanel';
import { PriorityBadge, StatusBadge } from '../../components/badges';
import { MapView } from '../../components/MapView';
import { toast } from '../../components/Toast';

type Step = 'capture' | 'details' | 'validate' | 'review' | 'done';
const TYPES: IssueType[] = ['gvp', 'littering', 'overflowing_bin', 'illegal_dumping', 'construction_debris', 'waste_burning'];
const SEVS: Severity[] = ['low', 'medium', 'high', 'critical'];
const SEV_TONE: Record<Severity, string> = {
  low: 'peer-checked:bg-ink-700 peer-checked:text-white',
  medium: 'peer-checked:bg-yellow-500 peer-checked:text-white',
  high: 'peer-checked:bg-orange-500 peer-checked:text-white',
  critical: 'peer-checked:bg-red-600 peer-checked:text-white',
};

function Stepper({ step }: { step: Step }) {
  const t = useT();
  const idx = { capture: 0, details: 1, validate: 2, review: 2, done: 3 }[step];
  const labels = [t('rp.step1'), t('rp.step2'), t('rp.step3'), t('rp.step4')];
  return (
    <div className="mb-6 flex items-center gap-2">
      {labels.map((l, i) => (
        <div key={l} className="flex flex-1 items-center gap-2">
          <span className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition', i < idx ? 'bg-emerald-500 text-white' : i === idx ? 'bg-brand-700 text-white ring-4 ring-brand-100' : 'bg-ink-100 text-ink-400')}>
            {i < idx ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
          </span>
          <span className={clsx('hidden text-xs font-semibold sm:block', i <= idx ? 'text-ink-800' : 'text-ink-400')}>{l}</span>
          {i < labels.length - 1 && <span className={clsx('h-0.5 flex-1 rounded', i < idx ? 'bg-emerald-400' : 'bg-ink-200')} />}
        </div>
      ))}
    </div>
  );
}

function Flow() {
  const t = useT();
  const citizen = useCitizen()!;
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const create = useStore((s) => s.createComplaint);
  const [step, setStep] = useState<Step>('capture');
  const [cap, setCap] = useState<Capture | null>(null);
  const [type, setType] = useState<IssueType>('gvp');
  const [desc, setDesc] = useState('');
  const [sev, setSev] = useState<Severity>('high');
  const [descErr, setDescErr] = useState(false);
  const [checks, setChecks] = useState(0);
  const [result, setResult] = useState<{ complaint: Complaint; hotspotEvent: { type: 'joined' | 'detected'; hotspot: Hotspot } | null } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const ai = useMemo(
    () => (cap ? analyze({ lat: cap.lat, lng: cap.lng, wardNo: cap.wardNo, citizenSeverity: sev, seed: cap.capturedAt % 100000, now: Date.now() }, complaints, hotspots) : null),
    [cap, sev, complaints, hotspots],
  );
  const priority = ai ? scoreToPriority(ai.score) : 'medium';

  useEffect(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [step]);

  useEffect(() => {
    if (step !== 'validate') return;
    setChecks(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setChecks(i);
      if (i >= 7) {
        clearInterval(id);
        setTimeout(() => setStep('review'), 600);
      }
    }, 520);
    return () => clearInterval(id);
  }, [step]);

  const submit = () => {
    if (!cap || !ai) return;
    setSubmitting(true);
    setTimeout(() => {
      const r = create({
        citizenId: citizen.citizenId,
        type,
        description: desc,
        citizenSeverity: sev,
        ai,
        evidence: { image: cap.image, capturedAt: cap.capturedAt, lat: cap.lat, lng: cap.lng, accuracy: cap.accuracy, simulated: cap.simulated, sceneSeed: cap.sceneSeed },
      });
      setResult(r);
      setSubmitting(false);
      setStep('done');
      if (r.hotspotEvent?.type === 'detected') toast('🚨 Repeat hotspot detected', `${r.hotspotEvent.hotspot.locationName} now has ${r.hotspotEvent.hotspot.complaintIds.length} incidents. Municipal officers alerted.`, 'alert');
    }, 700);
  };

  return (
    <div className={clsx('mx-auto px-4 py-6 sm:py-10', step === 'validate' || step === 'review' ? 'max-w-5xl' : 'max-w-3xl')}>
      <Stepper step={step} />

      {step === 'capture' && (
        <div className="page-enter">
          <div className="mb-4">
            <div className="eyebrow text-brand-600">📍 {t('home.camTitle')}</div>
            <h1 className="mt-1 text-2xl font-bold">{t('rp.cameraTitle')}</h1>
            <p className="mt-1 text-sm text-ink-500">{t('home.camSub')} <span className="mono font-semibold text-ink-700">· {citizen.citizenId}</span></p>
          </div>
          <GeoCamera
            mode="citizen"
            onCapture={(c) => {
              setCap(c);
              setStep('details');
            }}
          />
        </div>
      )}

      {step === 'details' && cap && ai && (
        <div className="page-enter space-y-5">
          <div className="card overflow-hidden">
            <div className="grid md:grid-cols-[1.2fr_1fr]">
              <div className="relative bg-black">
                <img src={cap.image} alt="Captured evidence" className="aspect-[4/3] h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-md bg-emerald-500 px-2 py-1 text-[11px] font-bold text-white">✓ {t('rp.preview').toUpperCase()}</span>
              </div>
              <div className="space-y-3 p-5">
                {[
                  [MapPin, t('common.location'), `${cap.locationName}`, `${t('common.ward')} ${cap.wardNo}`],
                  [Crosshair, t('common.coordinates'), fmtCoord(cap.lat, cap.lng), `±${cap.accuracy} m${cap.simulated ? ' · simulated GPS' : ' · device GPS'}`],
                  [Clock, t('common.timestamp'), fmtTime(cap.capturedAt), fmtDateTime(cap.capturedAt)],
                ].map(([I, k, v, s]) => {
                  const Icon = I as typeof MapPin;
                  return (
                    <div key={k as string} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700"><Icon className="h-4 w-4" /></span>
                      <div className="min-w-0">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">{k as string}</div>
                        <div className="truncate text-sm font-bold text-ink-900">{v as string}</div>
                        <div className="text-xs text-ink-500">{s as string}</div>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setStep('capture')} className="btn-secondary btn-sm">
                  <RotateCcw className="h-3.5 w-3.5" /> {t('rp.retake')}
                </button>
              </div>
            </div>
            <MapView className="h-40 rounded-none border-0 border-t" complaints={[]} focus={{ lat: cap.lat, lng: cap.lng, zoom: 16 }} user={{ lat: cap.lat, lng: cap.lng, label: 'Captured here' }} legend={false} />
          </div>

          <div className="card space-y-5 p-5">
            <div>
              <div className="label">{t('rp.issueType')}</div>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((ty) => (
                  <button key={ty} onClick={() => setType(ty)} className={clsx('rounded-xl border px-3 py-2 text-xs font-semibold transition', type === ty ? 'border-brand-600 bg-brand-50 text-brand-800' : 'border-ink-200 text-ink-600 hover:border-ink-300')}>
                    {t(`type.${ty}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="desc">{t('common.description')}</label>
              <textarea
                id="desc"
                rows={3}
                value={desc}
                onChange={(e) => {
                  setDesc(e.target.value);
                  setDescErr(false);
                }}
                placeholder={t('rp.describe')}
                className={clsx('input resize-none', descErr && 'border-red-400')}
              />
              {descErr && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3.5 w-3.5" />{t('rp.descRequired')}</p>}
            </div>
            <div>
              <div className="label">{t('rp.severity')}</div>
              <div className="grid grid-cols-4 gap-2">
                {SEVS.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name="sev" className="peer sr-only" checked={sev === s} onChange={() => setSev(s)} />
                    <span className={clsx('block rounded-xl border border-ink-200 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-ink-600 transition peer-checked:border-transparent', SEV_TONE[s])}>
                      {t(`priority.${s}`)}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink-50 p-4 ring-1 ring-ink-100">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">{t('rp.systemPriority')}</div>
                <div className="mt-1 flex items-center gap-2">
                  <PriorityBadge priority={priority} className="!text-sm !px-3 !py-1" />
                  <span className="text-xs text-ink-500">score {ai.score}/100 · simulated</span>
                </div>
                <p className="mt-1.5 max-w-md text-[11px] text-ink-500">{t('rp.priorityBasis')}</p>
              </div>
            </div>
            <button
              className="btn-primary btn-lg w-full"
              onClick={() => {
                if (desc.trim().length < 10) return setDescErr(true);
                setStep('validate');
              }}
            >
              <ScanSearch className="h-5 w-5" /> {t('rp.analyze')}
            </button>
          </div>
        </div>
      )}

      {(step === 'validate' || step === 'review') && cap && ai && (
        <div className="page-enter grid gap-5 lg:grid-cols-[1fr_1.15fr]">
          <div className="card overflow-hidden">
            <div className="relative bg-black">
              <img src={cap.image} alt="Evidence under analysis" className="aspect-[4/3] w-full object-cover" />
              {step === 'validate' && (
                <>
                  <div className="absolute inset-0 bg-brand-900/20" />
                  <div className="absolute inset-x-0 h-0.5 bg-brand-300 shadow-[0_0_18px_4px_rgba(128,210,185,.8)] animate-scan" />
                </>
              )}
              {checks >= 4 && (
                <div className="absolute left-[28%] top-[48%] h-[30%] w-[44%] rounded-md border-2 border-amber-400 page-enter">
                  <span className="absolute -top-5 left-0 rounded bg-amber-400 px-1.5 text-[10px] font-bold text-ink-900">garbage · {t(`priority.${ai.imageSeverity}`)}</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <div className="text-sm font-bold">{step === 'validate' ? t('rp.analyzing') : '✓ Evidence validated'}</div>
              <ul className="mt-3 space-y-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <li key={i} className={clsx('flex items-center gap-2.5 text-sm transition', checks >= i ? 'text-ink-800' : 'text-ink-300')}>
                    <span className={clsx('grid h-5 w-5 place-items-center rounded-full', checks >= i ? 'bg-emerald-500 text-white' : checks === i - 1 && step === 'validate' ? 'text-brand-600' : 'bg-ink-100')}>
                      {checks >= i ? <Check className="h-3 w-3" strokeWidth={3} /> : checks === i - 1 && step === 'validate' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    </span>
                    {t(`rp.chk${i}`)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="space-y-4">
            {step === 'review' ? (
              <div className="card page-enter p-5">
                <AiPanel ai={ai} priority={priority} />
                {ai.repeatArea && (
                  <div className="mt-4 flex gap-3 rounded-2xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">
                    <Siren className="h-5 w-5 shrink-0" />
                    <span>This location has prior verified incidents. Your report strengthens the repeat-hotspot evidence for root-cause action.</span>
                  </div>
                )}
                <button className="btn-primary btn-lg mt-5 w-full" onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />} {t('rp.create').toUpperCase()}
                </button>
                <button className="btn-ghost mt-2 w-full" onClick={() => setStep('details')}>{t('common.back')}</button>
              </div>
            ) : (
              <div className="card grid h-full min-h-[240px] place-items-center p-6 text-center">
                <div>
                  <div className="relative mx-auto h-16 w-16">
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand-200" />
                    <span className="relative grid h-16 w-16 place-items-center rounded-full bg-brand-700 text-white"><ScanSearch className="h-7 w-7" /></span>
                  </div>
                  <div className="mt-4 font-display text-lg font-bold">{t('rp.analyzing')}</div>
                  <p className="mt-1 text-sm text-ink-500">Geo-verification · garbage detection · duplicate & hotspot checks</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {step === 'done' && result && (
        <div className="page-enter">
          <div className="card overflow-hidden text-center">
            <div className="bg-gradient-to-br from-brand-700 to-brand-900 px-6 pb-10 pt-10 text-white">
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-white text-brand-700 shadow-pop animate-pop">
                <Check className="h-10 w-10" strokeWidth={3} />
              </div>
              <h1 className="mt-5 text-2xl font-bold">{t('rp.successTitle')}</h1>
              <p className="mx-auto mt-1 max-w-sm text-sm text-brand-100">{t('rp.successSub')}</p>
            </div>
            <div className="-mt-6 px-4 pb-6 sm:px-6">
              <div className="mx-auto max-w-md rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-lift">
                <div className="text-[11px] font-bold uppercase tracking-wider text-ink-400">{t(`type.${result.complaint.type}`)}</div>
                <div className="font-display text-xl font-extrabold">
                  {t(`type.${result.complaint.type}`)} #{result.complaint.num}
                </div>
                <div className="mono mt-0.5 text-sm font-bold text-brand-700">{result.complaint.id}</div>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[11px] uppercase tracking-wider text-ink-400">{t('common.ward')}</dt><dd className="font-semibold">{t('common.ward')} {result.complaint.wardNo}</dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wider text-ink-400">{t('common.reported')}</dt><dd className="font-semibold">{fmtTime(result.complaint.createdAt)}</dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wider text-ink-400">{t('common.priority')}</dt><dd className="mt-0.5"><PriorityBadge priority={result.complaint.priority} /></dd></div>
                  <div><dt className="text-[11px] uppercase tracking-wider text-ink-400">{t('common.citizen')}</dt><dd className="mono font-semibold">{result.complaint.citizenId}</dd></div>
                </dl>
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <div className="text-[11px] uppercase tracking-wider text-ink-400">{t('common.status')}</div>
                  <StatusBadge status={result.complaint.status} className="mt-1 !text-sm uppercase" />
                </div>
              </div>
              {result.hotspotEvent && (
                <div className="mx-auto mt-4 flex max-w-md gap-3 rounded-2xl bg-red-600 p-4 text-left text-white shadow-lift">
                  <Siren className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-bold">🚨 {result.hotspotEvent.type === 'detected' ? 'REPEAT HOTSPOT DETECTED' : 'Reported at a known repeat hotspot'}</div>
                    <div className="text-sm text-red-100">
                      {result.hotspotEvent.hotspot.locationName}, Ward {result.hotspotEvent.hotspot.wardNo} — {result.hotspotEvent.hotspot.complaintIds.length} verified incidents. Municipal officers have been alerted for field investigation.
                    </div>
                  </div>
                </div>
              )}
              <div className="mx-auto mt-6 flex max-w-md flex-col gap-2 sm:flex-row">
                <Link to={`/issues/${result.complaint.id}`} className="btn-primary flex-1">
                  {t('rp.track')} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to={`/live?highlight=${result.complaint.id}`} className="btn-secondary flex-1">
                  <MapIcon className="h-4 w-4" /> {t('nav.live')}
                </Link>
              </div>
              <button
                className="btn-ghost mt-2"
                onClick={() => {
                  setCap(null);
                  setDesc('');
                  setResult(null);
                  setStep('capture');
                }}
              >
                <Camera className="h-4 w-4" /> {t('rp.another')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReportFlow() {
  const t = useT();
  return (
    <CitizenGate
      context={
        <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-white">
          <Camera className="h-4 w-4" /> Sign in to {t('common.report').toLowerCase()} with geo-verified evidence.
        </div>
      }
    >
      <Flow />
    </CitizenGate>
  );
}
