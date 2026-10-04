import { useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Route as RouteIcon, Loader2, Warehouse, ArrowDown, Truck, Send, Flame, Gauge, Clock, MapPinned, Sparkles, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import { useStaff, useStore } from '../../lib/store';
import type { Complaint, OptimizedRoute, ZoneId } from '../../lib/types';
import { ZONES, haversineM, zoneById } from '../../lib/geo';
import { CREWS } from '../../lib/seed';
import { optimizeRoute } from '../../lib/route';
import { PRIORITY_RANK } from '../../lib/status';
import { MapView } from '../../components/MapView';
import { PriorityBadge } from '../../components/badges';
import { DemoTag } from '../../components/ui';
import { toast } from '../../components/Toast';
import { PageHead, Panel } from './shared';

export default function RouteOptimizer() {
  const staff = useStaff()!;
  const [params] = useSearchParams();
  const complaints = useStore((s) => s.complaints);
  const saveRoute = useStore((s) => s.saveRoute);
  const dispatchRoute = useStore((s) => s.dispatchRoute);
  const routes = useStore((s) => s.routes);
  const anchor = complaints.find((c) => c.id === params.get('anchor'));
  const [zone, setZone] = useState<ZoneId>(anchor?.zone ?? staff.zone);
  const [radius, setRadius] = useState(4);
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [found, setFound] = useState(0);
  const [route, setRoute] = useState<(OptimizedRoute & { stopsC: Complaint[]; naiveKm: number }) | null>(null);
  const [crew, setCrew] = useState(CREWS.find((k) => k.zone === zone)!.id);
  const depot = zoneById(zone).depot;

  const candidates = useMemo(() => {
    const open = complaints.filter((c) => (c.status === 'pending' || c.status === 'assigned') && haversineM(depot, c) <= radius * 1000);
    const sorted = open.sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || haversineM(depot, a) - haversineM(depot, b));
    let pick = sorted.slice(0, 12);
    if (anchor && (anchor.status === 'pending' || anchor.status === 'assigned') && !pick.some((p) => p.id === anchor.id)) pick = [anchor, ...pick.slice(0, 11)];
    return { all: open.length + (anchor && !open.some((o) => o.id === anchor.id) && (anchor.status === 'pending' || anchor.status === 'assigned') ? 1 : 0), pick };
  }, [complaints, depot, radius, anchor]);

  const run = () => {
    setPhase('scanning');
    setRoute(null);
    setFound(0);
    const target = candidates.all;
    let n = 0;
    const id = setInterval(() => {
      n = Math.min(target, n + Math.max(1, Math.ceil(target / 8)));
      setFound(n);
      if (n >= target) {
        clearInterval(id);
        setTimeout(() => {
          const r = optimizeRoute(depot, candidates.pick);
          const rt = {
            id: `RT-${zone}${String(Date.now()).slice(-4)}`,
            zone,
            stops: r.stops.map((s) => s.id),
            stopsC: r.stops,
            distanceKm: r.distanceKm,
            naiveKm: r.naiveKm,
            durationMin: r.durationMin,
            highPriority: r.stops.filter((s) => s.priority === 'high' || s.priority === 'critical').length,
            createdAt: Date.now(),
            dispatched: false,
          };
          setRoute(rt);
          saveRoute({ id: rt.id, zone: rt.zone, stops: rt.stops, distanceKm: rt.distanceKm, durationMin: rt.durationMin, highPriority: rt.highPriority, createdAt: rt.createdAt, dispatched: false });
          setPhase('done');
        }, 500);
      }
    }, 160);
  };

  const dispatched = route && routes.find((r) => r.id === route.id)?.dispatched;

  return (
    <div>
      <PageHead
        title="Map-Based Route Optimization"
        sub="One optimized route for multiple nearby issues — fewer trips, faster cleanup."
        right={<DemoTag label="Demo / Simulated" />}
      />
      <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Panel className="p-4">
            <div className="label">Start depot</div>
            <select
              className="input"
              value={zone}
              onChange={(e) => {
                const z = e.target.value as ZoneId;
                setZone(z);
                setCrew(CREWS.find((k) => k.zone === z)!.id);
                setPhase('idle');
                setRoute(null);
              }}
            >
              {ZONES.map((z) => <option key={z.id} value={z.id}>{z.depot.name}</option>)}
            </select>
            <div className="label mt-4">Search radius · {radius} km</div>
            <input type="range" min={2} max={7} step={0.5} value={radius} onChange={(e) => { setRadius(Number(e.target.value)); setPhase('idle'); setRoute(null); }} className="w-full accent-brand-700" />
            <div className="mt-1 flex justify-between text-[10px] text-ink-400"><span>2 km</span><span>7 km</span></div>
            {anchor && (
              <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs text-brand-800 ring-1 ring-brand-200">
                Including <b className="mono">{anchor.id}</b> ({anchor.locationName})
              </div>
            )}
            <button className="btn-primary btn-lg mt-4 w-full" onClick={run} disabled={phase === 'scanning'}>
              {phase === 'scanning' ? <Loader2 className="h-5 w-5 animate-spin" /> : <RouteIcon className="h-5 w-5" />} OPTIMIZE ROUTE
            </button>
            <p className="mt-2 text-[11px] text-ink-500">Considers open complaints (pending / assigned) within the radius, prioritising critical and high issues — up to 12 stops per trip.</p>
          </Panel>

          {phase !== 'idle' && (
            <Panel className="p-4 page-enter">
              <div className="flex items-center gap-2 text-sm font-bold">
                {phase === 'scanning' ? <Loader2 className="h-4 w-4 animate-spin text-brand-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                <span className="tabular-nums">{found}</span> nearby issues detected
              </div>
              {route && (
                <>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {[
                      [MapPinned, 'Issues covered', route.stops.length],
                      [Gauge, 'Estimated distance', `${route.distanceKm} km`],
                      [Flame, 'High-priority issues', route.highPriority],
                      [Clock, 'Est. duration', `${Math.floor(route.durationMin / 60)}h ${route.durationMin % 60}m`],
                    ].map(([I, k, v]) => {
                      const Icon = I as typeof Gauge;
                      return (
                        <div key={k as string} className="rounded-xl bg-ink-50 p-3">
                          <Icon className="h-4 w-4 text-brand-700" />
                          <div className="mt-1 font-display text-xl font-extrabold">{v as string}</div>
                          <div className="text-[10.5px] text-ink-500">{k as string}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-200">
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>One trip instead of {route.stops.length} separate trips — saves ≈ <b>{Math.max(0, route.naiveKm - route.distanceKm).toFixed(1)} km</b> versus individual dispatches ({route.naiveKm} km).</span>
                  </div>
                  <div className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700">Demo / Simulated values</div>
                </>
              )}
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel className="overflow-hidden">
            <MapView
              className="h-[440px] rounded-none border-0 sm:h-[540px]"
              complaints={route ? [] : candidates.pick}
              route={route ? { depot, stops: route.stopsC } : null}
              showDepots={!route}
              crews={CREWS.filter((k) => k.zone === zone)}
              focus={route ? null : { lat: depot.lat, lng: depot.lng, zoom: 13 }}
              scrollWheel
            />
          </Panel>
          {route && (
            <div className="grid gap-4 lg:grid-cols-[1fr_320px] page-enter">
              <Panel className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="font-bold">RECOMMENDED MUNICIPAL ROUTE <span className="mono ml-1 text-xs font-medium text-ink-400">{route.id}</span></div>
                  <DemoTag label="Simulated" />
                </div>
                <ol className="space-y-0">
                  <li className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink-900 text-white"><Warehouse className="h-4 w-4" /></span>
                    <span className="text-sm font-semibold">{depot.name}</span>
                  </li>
                  {route.stopsC.map((s, i) => (
                    <li key={s.id}>
                      <div className="ml-3.5 py-0.5 text-ink-300"><ArrowDown className="h-4 w-4" /></div>
                      <Link to={`/municipal/complaints/${s.id}`} className="flex items-center gap-3 rounded-xl px-1 py-1 hover:bg-ink-50">
                        <span className={clsx('grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold text-white', s.priority === 'critical' ? 'bg-red-600' : s.priority === 'high' ? 'bg-orange-500' : s.priority === 'medium' ? 'bg-yellow-500' : 'bg-ink-400')}>{i + 1}</span>
                        <span className="mono text-sm font-bold">{s.id}</span>
                        <span className="min-w-0 flex-1 truncate text-xs text-ink-500">W{s.wardNo} · {s.locationName}</span>
                        <PriorityBadge priority={s.priority} />
                      </Link>
                    </li>
                  ))}
                </ol>
              </Panel>
              <Panel className="h-fit p-4">
                <div className="font-bold">Dispatch</div>
                <p className="mt-1 text-xs text-ink-500">Assign the full route to one crew. Each complaint is updated and citizens are notified.</p>
                <div className="mt-3 space-y-2">
                  {CREWS.filter((k) => k.zone === zone).map((k) => (
                    <label key={k.id} className={clsx('flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm', crew === k.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200')}>
                      <input type="radio" className="accent-brand-700" checked={crew === k.id} onChange={() => setCrew(k.id)} />
                      <Truck className="h-4 w-4 text-blue-600" /> {k.name} <span className="text-xs text-ink-500">· {k.vehicle}</span>
                    </label>
                  ))}
                </div>
                <button
                  className="btn-primary mt-3 w-full"
                  disabled={!!dispatched}
                  onClick={() => {
                    dispatchRoute(route.id, crew, staff.staffId);
                    toast('Route dispatched', `${route.stops.length} complaints assigned to ${CREWS.find((k) => k.id === crew)?.name}.`);
                  }}
                >
                  {dispatched ? <><CheckCircle2 className="h-4 w-4" /> Dispatched</> : <><Send className="h-4 w-4" /> Dispatch route to crew</>}
                </button>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
