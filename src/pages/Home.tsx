import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Camera, Map as MapIcon, MapPin, Satellite, Clock, Loader2, ShieldCheck, ArrowRight, Eye, BadgeCheck, ClipboardList,
  UserRound, Building2, ScanSearch, Gauge, Radar, Layers, Sparkles, Smartphone,
} from 'lucide-react';
import { useT } from '../i18n';
import { useStore } from '../lib/store';
import { drawScene } from '../lib/scene';
import { bucketOf } from '../lib/status';
import { DemoTag } from '../components/ui';
import { IssueCard } from '../components/IssueCard';
import { StoryIllustration } from '../components/StoryIllustration';

function CameraPreview() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d')!;
    let raf = 0, last = 0;
    const loop = (ts: number) => {
      if (ts - last > 70) {
        drawScene(ctx, c.width, c.height, 'garbage', 424242, ts);
        last = ts;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);
  const t = useT();
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-black">
      <canvas ref={ref} width={640} height={480} className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute left-1/2 top-[55%] h-24 w-32 -translate-x-1/2 -translate-y-1/2">
        {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => (
          <span key={c} className={`absolute h-5 w-5 border-white ${c}`} />
        ))}
      </div>
      <div className="absolute inset-x-0 top-0 flex items-start justify-between bg-gradient-to-b from-black/60 to-transparent p-3 text-white">
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-bold backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> {t('home.liveCamera').toUpperCase()}
          </span>
          <span className="flex items-center gap-1 rounded-md bg-emerald-500/90 px-2 py-1 text-[11px] font-bold">
            <Satellite className="h-3 w-3" /> {t('home.gpsOn')}
          </span>
        </div>
        <span className="mono flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold backdrop-blur">
          <Clock className="h-3 w-3" />
          {new Date(now).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase()}
        </span>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-10 text-white">
        <div className="grid grid-cols-2 gap-2 text-[12px]">
          <div className="rounded-lg bg-white/10 px-2.5 py-1.5 backdrop-blur">
            <div className="text-[10px] uppercase tracking-wider text-ink-300">{t('common.location')}</div>
            <div className="flex items-center gap-1 font-semibold">
              <Loader2 className="h-3 w-3 animate-spin text-brand-300" /> {t('common.detecting')}
            </div>
          </div>
          <div className="rounded-lg bg-white/10 px-2.5 py-1.5 backdrop-blur">
            <div className="text-[10px] uppercase tracking-wider text-ink-300">{t('common.ward')}</div>
            <div className="flex items-center gap-1 font-semibold">
              <Loader2 className="h-3 w-3 animate-spin text-brand-300" /> {t('common.detecting')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PROVIDES: [typeof Camera, string, string][] = [
  [Camera, 'geo', 'bg-brand-50 text-brand-700'],
  [ScanSearch, 'validation', 'bg-sky-50 text-sky-700'],
  [ClipboardList, 'tracking', 'bg-indigo-50 text-indigo-700'],
  [BadgeCheck, 'verification', 'bg-violet-50 text-violet-700'],
  [Radar, 'hotspots', 'bg-red-50 text-red-600'],
  [Eye, 'monitoring', 'bg-emerald-50 text-emerald-700'],
];

export default function Home() {
  const t = useT();
  const nav = useNavigate();
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const open = complaints.filter((c) => bucketOf(c.status) !== 'resolved').length;
  const resolved = complaints.length - open;
  const hsIds = new Set(hotspots.flatMap((h) => h.complaintIds));
  const latest = complaints.slice(0, 4);


  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-ink-100 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_10%,rgba(40,156,128,.10),transparent_70%)]" />
        <div className="container-x relative grid items-center gap-10 py-10 lg:grid-cols-[1.05fr_1fr] lg:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
              <Building2 className="h-3.5 w-3.5" /> {t('home.badge')}
            </span>
            <h1 className="mt-5 text-[40px] font-extrabold leading-[1.05] text-ink-950 sm:text-5xl lg:text-[58px]">
              {t('home.title1')}
              <br />
              <span className="text-brand-700">{t('home.title2')}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-600 sm:text-lg">{t('home.sub')}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/report" className="btn-primary btn-lg">
                <Camera className="h-5 w-5" /> {t('common.report').toUpperCase()}
              </Link>
              <Link to="/live" className="btn-secondary btn-lg">
                <MapIcon className="h-5 w-5" /> {t('common.viewLive').toUpperCase()}
              </Link>
            </div>
            <p className="mt-5 flex items-start gap-2 text-xs text-ink-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-brand-600" /> {t('home.privacy')}
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                [open, t('home.statsOpen'), 'text-amber-600'],
                [resolved, t('home.statsResolved'), 'text-emerald-600'],
                [hotspots.length, t('home.statsHotspots'), 'text-red-600'],
                [16, t('home.statsWards'), 'text-brand-700'],
              ].map(([v, l, c]) => (
                <div key={l as string} className="rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card">
                  <div className={`font-display text-2xl font-extrabold tabular-nums ${c}`}>{v}</div>
                  <div className="text-[11px] font-medium leading-tight text-ink-500">{l}</div>
                </div>
              ))}
            </div>
            <DemoTag className="mt-2" label="Demo data · live platform counts" />
          </div>

          {/* GEO-VERIFIED REPORTING CARD */}
          <div id="geo-camera" className="relative">
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-brand-200/50 to-sky-200/40 blur-2xl" />
            <div className="relative rounded-[28px] border border-ink-100 bg-white p-4 shadow-pop sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[12px] font-extrabold tracking-[0.14em] text-brand-700">
                    <MapPin className="h-4 w-4" /> {t('home.camTitle')}
                  </div>
                  <div className="mt-0.5 font-display text-lg font-bold text-ink-900">{t('home.camSub')}</div>
                </div>
                <span className="hidden rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 ring-1 ring-red-200 sm:inline-flex">● REC</span>
              </div>
              <button onClick={() => nav('/report')} className="block w-full text-left" aria-label={t('home.capture')}>
                <CameraPreview />
              </button>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                {[
                  [Camera, t('home.camera')],
                  [Satellite, 'GPS'],
                  [MapPin, t('common.location')],
                  [Clock, t('common.timestamp')],
                ].map(([I, l], i) => {
                  const Icon = I as typeof Camera;
                  return (
                    <div key={i} className="rounded-xl bg-brand-50 px-1 py-2 text-brand-800">
                      <Icon className="mx-auto h-4 w-4" />
                      <div className="mt-1 truncate text-[10.5px] font-bold uppercase tracking-wide">{l as string}</div>
                    </div>
                  );
                })}
              </div>
              <button onClick={() => nav('/report')} className="btn-primary btn-lg mt-4 w-full text-[15px]">
                <Camera className="h-5 w-5" /> {t('home.capture').toUpperCase()}
              </button>
              <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-medium text-ink-500">
                <Smartphone className="h-3.5 w-3.5" /> {t('home.noGallery')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT CIVICSENSE PROVIDES */}
      <section className="container-x py-14">
        <div className="overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-card">
          <StoryIllustration className="h-auto w-full" />
        </div>
        <div className="mt-10">
          <div className="eyebrow text-brand-600">{t('home.providesEyebrow')}</div>
          <h2 className="mt-1 text-2xl font-bold">{t('home.providesTitle')}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDES.map(([Icon, key, tone]) => (
              <div key={key} className="card flex gap-4 p-5 transition hover:shadow-lift">
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="font-display text-[15px] font-bold text-ink-900">{t(`home.pv.${key}`)}</div>
                  <p className="mt-1 text-sm text-ink-500">{t(`home.pv.${key}Desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LATEST LIVE */}
      <section className="container-x pb-4">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="eyebrow mb-1 flex items-center gap-2 text-brand-600">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" /></span>
              {t('lv.liveNow')}
            </div>
            <h2 className="text-2xl font-bold">{t('home.latest')}</h2>
          </div>
          <Link to="/live" className="btn-secondary">
            {t('common.viewLive')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((c) => (
            <IssueCard key={c.id} c={c} hotspot={hsIds.has(c.id)} />
          ))}
        </div>
      </section>

      {/* EXPERIENCES */}
      <section className="container-x py-14">
        <h2 className="text-2xl font-bold">{t('home.roles')}</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { to: '/citizen', icon: UserRound, title: t('nav.citizen'), text: t('home.roleCitizen'), tone: 'bg-brand-50 text-brand-700' },
            { to: '/municipal', icon: Building2, title: 'Municipal Command Center', text: t('home.roleMunicipal'), tone: 'bg-sky-50 text-sky-700' },
            { to: '/verifier', icon: BadgeCheck, title: t('nav.verifier'), text: t('home.roleVerifier'), tone: 'bg-violet-50 text-violet-700' },
          ].map((r) => (
            <Link key={r.to} to={r.to} className="card group p-6 transition hover:-translate-y-0.5 hover:shadow-lift">
              <span className={`grid h-11 w-11 place-items-center rounded-xl ${r.tone}`}>
                <r.icon className="h-5 w-5" />
              </span>
              <div className="mt-4 font-display text-lg font-bold">{r.title}</div>
              <p className="mt-1 text-sm text-ink-500">{r.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* INTELLIGENCE */}
      <section className="container-x">
        <div className="rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="eyebrow text-brand-600">CivicSense Intelligence</div>
              <h2 className="mt-1 text-2xl font-bold">Evidence-aware prioritization, built in.</h2>
            </div>
            <DemoTag label="Simulated model outputs" />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [ScanSearch, 'Garbage / Litter Detection', 'Checks each captured photo for visible waste.'],
              [Gauge, 'Image Severity Estimation', 'Estimates volume & spread to grade severity.'],
              [Layers, 'Duplicate Detection', 'Links reports within 120 m of open complaints.'],
              [Radar, 'Geo-Spatial Hotspots', '3+ verified incidents within 150 m in 45 days.'],
              [Sparkles, 'Priority Scoring', 'Severity + location sensitivity + repeat history.'],
            ].map(([I, title, text]) => {
              const Icon = I as typeof Gauge;
              return (
                <div key={title as string} className="rounded-2xl bg-ink-50/70 p-4">
                  <Icon className="h-5 w-5 text-brand-700" />
                  <div className="mt-3 text-sm font-bold text-ink-900">{title as string}</div>
                  <p className="mt-1 text-xs text-ink-500">{text as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
