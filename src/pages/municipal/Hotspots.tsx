import { Link } from 'react-router-dom';
import { Siren, MapPin, Clock, Search, ArrowRight, Info } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../../lib/store';
import { timeAgo } from '../../lib/format';
import { HOTSPOT_RADIUS_M, HOTSPOT_THRESHOLD, HOTSPOT_WINDOW_DAYS } from '../../lib/ai';
import { MapView } from '../../components/MapView';
import { DemoTag } from '../../components/ui';
import { HS_STATUS, recommendedAction, isPersistent } from './hotspotMeta';
import { PageHead, Panel } from './shared';

export default function Hotspots() {
  const hotspots = useStore((s) => s.hotspots);
  const complaints = useStore((s) => s.complaints);
  const order = { detected: 0, investigating: 1, action_assigned: 2, monitoring: 3 };
  const list = [...hotspots].sort((a, b) => order[a.status] - order[b.status] || b.complaintIds.length - a.complaintIds.length);
  const last = (ids: string[]) => Math.max(...ids.map((id) => complaints.find((c) => c.id === id)?.createdAt ?? 0));

  return (
    <div>
      <PageHead title="Repeat Hotspots" sub="Locations that keep generating verified complaints — investigated for root cause, corrected and monitored." right={<DemoTag />} />
      <div className="mb-5 flex items-start gap-2 rounded-2xl bg-white p-4 text-sm text-ink-600 shadow-card ring-1 ring-ink-200/60">
        <Info className="h-4 w-4 shrink-0 text-brand-600" />
        <span><b>Detection rule:</b> {HOTSPOT_THRESHOLD}+ geo-verified complaints within {HOTSPOT_RADIUS_M} m in {HOTSPOT_WINDOW_DAYS} days automatically creates a repeat hotspot. A recurrence after corrective action reopens it.</span>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((h) => {
            const st = HS_STATUS[h.status];
            const detected = h.status === 'detected';
            return (
              <div key={h.id} className={clsx('overflow-hidden rounded-2xl border bg-white shadow-card', detected ? 'border-red-300 ring-2 ring-red-100' : 'border-ink-200/60')}>
                {detected && (
                  <div className="flex items-center gap-2 bg-red-600 px-4 py-2 text-xs font-extrabold tracking-wider text-white">
                    <Siren className="h-4 w-4 animate-pulse" /> 🚨 REPEAT HOTSPOT DETECTED
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="mono text-xs font-bold text-ink-400">{h.id}</div>
                      <div className="font-display text-lg font-bold">{h.locationName}</div>
                      <div className="flex items-center gap-1 text-xs text-ink-500"><MapPin className="h-3.5 w-3.5" /> Ward {h.wardNo} · Zone {h.zone}</div>
                    </div>
                    <span className={clsx('shrink-0 rounded-lg px-2 py-1 text-[9.5px] font-bold uppercase leading-tight', st.tone)}>{st.label}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                    <div className="rounded-xl bg-red-50 p-2.5">
                      <div className="font-display text-2xl font-extrabold text-red-600">{h.complaintIds.length}</div>
                      <div className="text-[10.5px] text-red-800/70">Verified incidents</div>
                    </div>
                    <div className="rounded-xl bg-ink-50 p-2.5">
                      <div className="flex items-center justify-center gap-1 font-display text-base font-extrabold text-ink-800"><Clock className="h-4 w-4" />{timeAgo(last(h.complaintIds))}</div>
                      <div className="text-[10.5px] text-ink-500">Last occurrence</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-ink-500">Recommended action</span>
                    <span className="font-bold text-ink-900">{recommendedAction(h)}</span>
                  </div>
                  {isPersistent(h) && <div className="mt-2 rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-800">Enforcement support available</div>}
                  <Link to={`/municipal/hotspots/${h.id}`} className={clsx('mt-4 w-full', detected ? 'btn-danger' : 'btn-secondary')}>
                    <Search className="h-4 w-4" /> {detected ? 'INVESTIGATE HOTSPOT' : 'Open investigation'} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <Panel className="h-fit overflow-hidden xl:sticky xl:top-20">
          <div className="border-b border-ink-100 px-4 py-3 font-bold">Hotspot map</div>
          <MapView className="h-[520px] rounded-none border-0" complaints={complaints.filter((c) => hotspots.some((h) => h.complaintIds.includes(c.id)))} hotspots={hotspots} linkBase="/municipal/complaints/" />
        </Panel>
      </div>
    </div>
  );
}
