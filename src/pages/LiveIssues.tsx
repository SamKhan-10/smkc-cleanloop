import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { LayoutGrid, Map as MapIcon, Search, Siren, Timer, CheckCircle2, CircleDot, Trophy, Eye } from 'lucide-react';
import { useT } from '../i18n';
import { useStore } from '../lib/store';
import { bucketOf } from '../lib/status';
import { IssueCard } from '../components/IssueCard';
import { MapView } from '../components/MapView';
import { DemoTag, EmptyState, Segmented } from '../components/ui';

type F = 'all' | 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'hotspots';

export default function LiveIssues() {
  const t = useT();
  const [params, setParams] = useSearchParams();
  const highlight = params.get('highlight') ?? undefined;
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const [filter, setFilter] = useState<F>((params.get('filter') as F) || 'all');
  const [view, setView] = useState<'list' | 'map'>((params.get('view') as 'map') || 'list');
  const [q, setQ] = useState('');
  const [zone, setZone] = useState('all');
  const [limit, setLimit] = useState(24);
  const pView = params.get('view');
  const pFilter = params.get('filter');
  useEffect(() => {
    if (pView === 'map' || pView === 'list') setView(pView);
  }, [pView]);
  useEffect(() => {
    if (pFilter) setFilter(pFilter as F);
  }, [pFilter]);

  const hsIds = useMemo(() => new Set(hotspots.flatMap((h) => h.complaintIds)), [hotspots]);
  const match = (f: F, c: (typeof complaints)[number]) =>
    f === 'all' ||
    (f === 'pending' && c.status === 'pending') ||
    (f === 'assigned' && c.status === 'assigned') ||
    (f === 'in_progress' && bucketOf(c.status) === 'in_progress') ||
    (f === 'resolved' && c.status === 'verified_resolved') ||
    (f === 'hotspots' && hsIds.has(c.id));

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const list = complaints.filter(
      (c) =>
        match(filter, c) &&
        (zone === 'all' || c.zone === zone) &&
        (!qq || c.id.toLowerCase().includes(qq) || c.locationName.toLowerCase().includes(qq) || `ward ${c.wardNo}` === qq || String(c.wardNo) === qq || c.citizenId.toLowerCase().includes(qq)),
    );
    if (highlight) {
      const i = list.findIndex((c) => c.id === highlight);
      if (i > 0) list.unshift(list.splice(i, 1)[0]);
    }
    return list;
  }, [complaints, filter, q, zone, hsIds, highlight]); // eslint-disable-line

  const count = (f: F) => complaints.filter((c) => match(f, c)).length;
  const open = complaints.filter((c) => c.status !== 'verified_resolved').length;
  const resolved = complaints.filter((c) => c.verification);
  const avgH = resolved.reduce((s, c) => s + (c.verification!.at - c.createdAt), 0) / Math.max(1, resolved.length) / 3600000;
  const hl = highlight ? complaints.find((c) => c.id === highlight) : undefined;

  return (
    <div className="container-x py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="eyebrow flex items-center gap-2 text-brand-600">
            <Eye className="h-3.5 w-3.5" /> {t('lv.public')}
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700 ring-1 ring-emerald-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> {t('lv.liveNow')}
            </span>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold">{t('lv.title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-500">{t('lv.sub')}</p>
        </div>
        <Link to="/rankings" className="btn-secondary"><Trophy className="h-4 w-4" /> {t('nav.rankings')}</Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          [CircleDot, open, t('home.statsOpen'), 'text-amber-600 bg-amber-50'],
          [CheckCircle2, complaints.length - open, t('home.statsResolved'), 'text-emerald-600 bg-emerald-50'],
          [Siren, hotspots.length, t('home.statsHotspots'), 'text-red-600 bg-red-50'],
          [Timer, `${avgH.toFixed(1)} h`, t('lv.avgResolution'), 'text-sky-600 bg-sky-50'],
        ].map(([I, v, l, tone]) => {
          const Icon = I as typeof Siren;
          return (
            <div key={l as string} className="card flex items-center gap-3 p-4">
              <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
              <div>
                <div className="font-display text-xl font-extrabold tabular-nums">{v as string}</div>
                <div className="text-xs text-ink-500">{l as string}</div>
              </div>
            </div>
          );
        })}
      </div>
      <DemoTag className="mt-2" label="Demo data + live platform activity" />

      <div className="sticky top-16 z-[800] -mx-4 mt-6 border-b border-ink-100 bg-[#f6f8f7]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:bg-white/95 sm:px-3">
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
            <Segmented<F>
              value={filter}
              onChange={(v) => {
                setFilter(v);
                setLimit(24);
              }}
              className="!flex-nowrap"
              options={[
                { value: 'all', label: t('common.all'), count: complaints.length },
                { value: 'pending', label: t('filter.pending'), count: count('pending') },
                { value: 'assigned', label: t('filter.assigned'), count: count('assigned') },
                { value: 'in_progress', label: t('filter.in_progress'), count: count('in_progress') },
                { value: 'resolved', label: t('filter.resolved'), count: count('resolved') },
                { value: 'hotspots', label: <span className="text-red-600">🚨 {t('filter.hotspots')}</span>, count: count('hotspots') },
              ]}
            />
          </div>
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1 2xl:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('common.search')} className="input !py-2 pl-9" />
            </div>
            <select value={zone} onChange={(e) => setZone(e.target.value)} className="input !w-auto !py-2" aria-label="Ward office">
              <option value="all">All wards</option>
              {['A', 'B', 'C', 'D'].map((z) => <option key={z} value={z}>Ward {z}</option>)}
            </select>
            <Segmented
              value={view}
              onChange={(v) => {
                setView(v);
                setParams((p) => { p.set('view', v); return p; }, { replace: true });
              }}
              options={[
                { value: 'list', label: <span className="flex items-center gap-1"><LayoutGrid className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('common.listView')}</span></span> },
                { value: 'map', label: <span className="flex items-center gap-1"><MapIcon className="h-3.5 w-3.5" /><span className="hidden sm:inline">{t('common.mapView')}</span></span> },
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        {filtered.length === 0 ? (
          <EmptyState icon={<Search className="h-5 w-5" />} title={t('common.noResults')} />
        ) : view === 'list' ? (
          <>
            <div className="mb-3 text-xs font-medium text-ink-500">{t('lv.showing', { n: Math.min(limit, filtered.length), total: filtered.length })}</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, limit).map((c) => (
                <IssueCard key={c.id} c={c} hotspot={hsIds.has(c.id)} isNew={c.id === highlight} />
              ))}
            </div>
            {limit < filtered.length && (
              <div className="mt-6 text-center">
                <button className="btn-secondary" onClick={() => setLimit((l) => l + 24)}>{t('common.loadMore')}</button>
              </div>
            )}
          </>
        ) : (
          <MapView
            className="h-[70vh] min-h-[420px]"
            complaints={filtered}
            hotspots={filter === 'all' || filter === 'hotspots' ? hotspots : []}
            highlightId={highlight}
            focus={hl ? { lat: hl.lat, lng: hl.lng, zoom: 15 } : null}
            scrollWheel
          />
        )}
      </div>
    </div>
  );
}
