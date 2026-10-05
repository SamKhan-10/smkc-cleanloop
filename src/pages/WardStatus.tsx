import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, Search, LocateFixed, Loader2, ArrowRight, CheckCircle2, TrendingUp, ShieldCheck, BadgeCheck, Timer, Repeat, MessageSquareHeart, ClipboardCheck, MapPin } from 'lucide-react';
import clsx from 'clsx';
import { useT } from '../i18n';
import { useWardStatuses } from '../lib/useWardStatus';
import { LEVEL_KEY, type StatusLevel } from '../lib/wardStatus';
import { ZONES } from '../lib/geo';
import { useGeo } from '../lib/useGeo';
import { StatusStars, LEVEL_TONE } from '../components/StatusStars';
import { DemoTag, Segmented } from '../components/ui';

const HL_ICON: Record<string, typeof CheckCircle2> = {
  'ws.h.resStrong': CheckCircle2,
  'ws.h.resSteady': CheckCircle2,
  'ws.h.resProgress': TrendingUp,
  'ws.h.hsNone': ShieldCheck,
  'ws.h.hsDecreasing': TrendingUp,
  'ws.h.hsInvestigating': ClipboardCheck,
  'ws.h.hsRemain': Repeat,
  'ws.h.timePrompt': Timer,
  'ws.h.focus': TrendingUp,
};

export default function WardStatus() {
  const t = useT();
  const [params] = useSearchParams();
  const statuses = useWardStatuses();
  const [area, setArea] = useState<string>('all');
  const [q, setQ] = useState('');
  const [mine, setMine] = useState<number | null>(params.get('ward') ? Number(params.get('ward')) : null);
  const [locating, setLocating] = useState(false);
  const geo = useGeo();
  const cardRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const wardParam = params.get('ward');

  useEffect(() => {
    if (!wardParam) return;
    setMine(Number(wardParam));
    setArea('all');
    setQ('');
  }, [wardParam]);

  useEffect(() => {
    if (!locating) return;
    if ((geo.status === 'ok' || geo.status === 'fallback') && geo.info) {
      setMine(geo.info.ward.no);
      setArea('all');
      setQ('');
      setLocating(false);
    }
  }, [geo.status, geo.info, locating]);

  useEffect(() => {
    if (mine) setTimeout(() => cardRefs.current[mine]?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 150);
  }, [mine]);

  // Always listed in ward-number order — never ordered by status.
  const list = useMemo(() => {
    const qq = q.trim().replace(/^ward\s*/i, '');
    return statuses.filter((s) => (area === 'all' || s.zone === area) && (!qq || String(s.wardNo) === qq || s.name.toLowerCase().includes(qq.toLowerCase())));
  }, [statuses, area, q]);

  const levels: StatusLevel[] = [5, 4, 3];

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow flex items-center gap-2 text-brand-600"><Eye className="h-3.5 w-3.5" /> {t('lv.public')}</div>
          <h1 className="mt-1 text-3xl font-extrabold">{t('ws.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{t('ws.sub')}</p>
        </div>
        <DemoTag />
      </div>

      {/* Legend */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {levels.map((l) => (
          <div key={l} className="flex items-center gap-3 rounded-2xl border border-ink-100 bg-white px-4 py-3 shadow-card">
            <StatusStars level={l} size="h-4 w-4" />
            <div className="min-w-0">
              <div className="text-sm font-bold text-ink-900">{t(`ws.${LEVEL_KEY[l]}`)}</div>
              <div className="text-xs text-ink-500">{t(`ws.${LEVEL_KEY[l]}Desc`)}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="scrollbar-thin overflow-x-auto">
          <Segmented
            value={area}
            onChange={setArea}
            className="!flex-nowrap"
            options={[{ value: 'all', label: t('ws.allAreas') }, ...ZONES.map((z) => ({ value: z.id, label: z.area }))]}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1 lg:w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('ws.search')} className="input !py-2 pl-9" />
          </div>
          <button
            className="btn-secondary"
            onClick={() => {
              setLocating(true);
              geo.request();
            }}
          >
            {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
            <span className="hidden sm:inline">{t('ws.findMine')}</span>
          </button>
        </div>
      </div>
      {mine && geo.simulated && geo.info?.ward.no === mine && (
        <p className="mt-2 text-xs text-amber-700">{t('ws.simulatedLocation')}</p>
      )}

      {/* Cards (ward-number order) */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {list.map((s) => {
          const tone = LEVEL_TONE[s.level];
          const isMine = s.wardNo === mine;
          return (
            <div
              key={s.wardNo}
              ref={(el) => (cardRefs.current[s.wardNo] = el)}
              className={clsx('flex flex-col rounded-2xl border bg-white p-5 shadow-card transition', isMine ? 'border-brand-400 ring-2 ring-brand-200' : 'border-ink-100')}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-display text-sm font-extrabold tracking-[0.12em] text-ink-900">{t('common.ward').toUpperCase()} {s.wardNo}</div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-ink-500"><MapPin className="h-3 w-3 shrink-0" />{s.name} · {ZONES.find((z) => z.id === s.zone)!.area}</div>
                </div>
                {isMine && <span className="shrink-0 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{t('ws.yourWard')}</span>}
              </div>
              <StatusStars level={s.level} className="mt-4" />
              <div className={clsx('mt-2 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', tone.bg, tone.text, tone.ring)}>
                <span className={clsx('h-1.5 w-1.5 rounded-full', tone.dot)} />
                {t('ws.statusLabel', { level: t(`ws.${LEVEL_KEY[s.level]}`) })}
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {s.highlights.map((h) => {
                  const Icon = HL_ICON[h] ?? CheckCircle2;
                  return (
                    <li key={h} className="flex items-start gap-2 text-sm text-ink-600">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {t(h)}
                    </li>
                  );
                })}
              </ul>
              <Link to={`/live?q=${s.wardNo}`} className="mt-4 inline-flex items-center gap-1 border-t border-ink-100 pt-3 text-xs font-bold uppercase tracking-wide text-brand-700 hover:text-brand-800">
                {t('ws.viewIssues')} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
      {list.length === 0 && <p className="mt-6 text-center text-sm text-ink-500">{t('common.noResults')}</p>}

      {/* How status is determined */}
      <div className="mt-10 rounded-3xl border border-ink-100 bg-white p-6 shadow-card sm:p-8">
        <h2 className="text-lg font-bold">{t('ws.howTitle')}</h2>
        <p className="mt-1 max-w-3xl text-sm text-ink-500">{t('ws.howSub')}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            [BadgeCheck, 'ws.i.resolution'],
            [Timer, 'ws.i.timeliness'],
            [Repeat, 'ws.i.hotspots'],
            [ShieldCheck, 'ws.i.verification'],
            [MessageSquareHeart, 'ws.i.feedback'],
          ].map(([I, k]) => {
            const Icon = I as typeof Timer;
            return (
              <div key={k as string} className="rounded-2xl bg-ink-50/70 p-4">
                <Icon className="h-5 w-5 text-brand-700" />
                <div className="mt-2 text-sm font-semibold text-ink-800">{t(k as string)}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-5 text-xs text-ink-500">{t('ws.note')}</p>
      </div>
    </div>
  );
}
