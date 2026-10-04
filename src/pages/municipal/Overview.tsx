import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Hourglass, Timer, CheckCircle2, Siren, ArrowRight, Route as RouteIcon, Layers, X, MapPin, Clock, UserRound } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import clsx from 'clsx';
import { useStaff, useStore } from '../../lib/store';
import type { Complaint } from '../../lib/types';
import { CREWS } from '../../lib/seed';
import { ZONES } from '../../lib/geo';
import { PRIORITY_RANK, ZONE_COLOR } from '../../lib/status';
import { fmtWhen, timeAgo } from '../../lib/format';
import { MapView } from '../../components/MapView';
import { PriorityBadge, StatusBadge } from '../../components/badges';
import { EvidenceImage } from '../../components/EvidenceImage';
import { DemoTag } from '../../components/ui';
import { useT } from '../../i18n';
import { KpiCard, PageHead, Panel, zoneStats } from './shared';

export default function Overview() {
  const t = useT();
  const nav = useNavigate();
  const staff = useStaff()!;
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const [layers, setLayers] = useState({ wards: true, resolved: false, hotspots: true, crews: true, depots: true });
  const [sel, setSel] = useState<Complaint | null>(null);
  const s = zoneStats(complaints, null, hotspots.length);
  const open = useMemo(
    () =>
      complaints
        .filter((c) => c.status !== 'verified_resolved')
        .sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || a.createdAt - b.createdAt),
    [complaints],
  );
  const mapComplaints = layers.resolved ? complaints : open;
  const detected = hotspots.filter((h) => h.status === 'detected');
  const hsSet = new Set(hotspots.flatMap((h) => h.complaintIds));

  const wardData = ZONES.map((z) => {
    const st = zoneStats(complaints, z.id, hotspots.filter((h) => h.zone === z.id).length);
    return { name: z.name, Pending: st.pending, 'In Progress': st.inProgress, Resolved: st.resolved, ...st, zone: z.id, area: z.area };
  });

  return (
    <div>
      <PageHead
        title="SMKC Municipal Command Center"
        sub={`Welcome back · ${staff.staffId} · Ward ${staff.zone} office · ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        right={
          <div className="flex gap-2">
            <Link to="/municipal/routes" className="btn-primary"><RouteIcon className="h-4 w-4" /> Optimize Route</Link>
          </div>
        }
      />

      {detected.length > 0 && (
        <Link to="/municipal/hotspots" className="mb-5 flex items-center gap-3 rounded-2xl bg-red-600 p-4 text-white shadow-lift transition hover:bg-red-700">
          <span className="relative grid h-10 w-10 place-items-center rounded-xl bg-white/15"><Siren className="h-5 w-5" /><span className="cl-pulse bg-white/30" /></span>
          <div className="flex-1">
            <div className="font-bold">🚨 {detected.length} REPEAT HOTSPOT{detected.length > 1 ? 'S' : ''} DETECTED — field investigation recommended</div>
            <div className="text-sm text-red-100">{detected.slice(0, 3).map((h) => `${h.locationName} (Ward ${h.wardNo})`).join(' · ')}</div>
          </div>
          <ArrowRight className="h-5 w-5" />
        </Link>
      )}

      <div className="mb-1 flex items-center gap-2"><DemoTag /><span className="text-[11px] text-ink-500">Counts include live platform activity</span></div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Total Reports" value={s.total} tone="bg-brand-50 text-brand-700" icon={<FileText className="h-4 w-4" />} />
        <KpiCard label="Pending" value={s.pending} tone="bg-sky-50 text-sky-600" icon={<Hourglass className="h-4 w-4" />} sub="Pending review + assigned" />
        <KpiCard label="In Progress" value={s.inProgress} tone="bg-amber-50 text-amber-600" icon={<Timer className="h-4 w-4" />} sub="Cleanup + verification" />
        <KpiCard label="Resolved" value={s.resolved} tone="bg-emerald-50 text-emerald-600" icon={<CheckCircle2 className="h-4 w-4" />} sub="Ground-verified" />
        <KpiCard label="Repeat Hotspots" value={s.hotspots} tone="bg-red-50 text-red-600" icon={<Siren className="h-4 w-4" />} sub={`${detected.length} awaiting investigation`} />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <Panel className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
            <div className="font-bold">City Ward Map <span className="ml-1 text-xs font-medium text-ink-400">· {mapComplaints.length} complaints shown</span></div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Layers className="h-4 w-4 text-ink-400" />
              {(
                [
                  ['wards', 'Ward boundaries'],
                  ['resolved', 'Resolved'],
                  ['hotspots', 'Hotspots'],
                  ['crews', 'Teams'],
                  ['depots', 'Depots'],
                ] as const
              ).map(([k, l]) => (
                <button key={k} onClick={() => setLayers((x) => ({ ...x, [k]: !x[k] }))} className={clsx('rounded-lg px-2 py-1 text-[11px] font-semibold ring-1 transition', layers[k] ? 'bg-brand-50 text-brand-800 ring-brand-200' : 'text-ink-500 ring-ink-200')}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <MapView
              className="h-[460px] rounded-none border-0 sm:h-[600px]"
              complaints={mapComplaints}
              hotspots={layers.hotspots ? hotspots : []}
              showWards={layers.wards}
              crews={layers.crews ? CREWS : []}
              showDepots={layers.depots}
              onSelect={setSel}
              highlightId={sel?.id}
              scrollWheel
            />
            {sel && (
              <div className="absolute right-3 top-3 z-[600] w-[290px] overflow-hidden rounded-2xl bg-white shadow-pop page-enter">
                <div className="relative">
                  <EvidenceImage src={sel.evidence.image} alt="" className="h-32 w-full" w={400} h={240} />
                  <button onClick={() => setSel(null)} className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"><X className="h-4 w-4" /></button>
                  {hsSet.has(sel.id) && <span className="absolute bottom-2 left-2 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">🚨 HOTSPOT</span>}
                </div>
                <div className="p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="mono font-bold">{sel.id}</span>
                    <PriorityBadge priority={sel.priority} />
                  </div>
                  <div className="mt-1 text-xs text-ink-500">{t(`type.${sel.type}`)}</div>
                  <div className="mt-2 space-y-1 text-xs text-ink-600">
                    <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Ward {sel.wardNo} · {sel.locationName}</div>
                    <div className="flex items-center gap-1.5"><UserRound className="h-3.5 w-3.5" /> <span className="mono">{sel.citizenId}</span></div>
                    <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {fmtWhen(sel.createdAt)}</div>
                  </div>
                  <div className="mt-2"><StatusBadge status={sel.status} /></div>
                  <button onClick={() => nav(`/municipal/complaints/${sel.id}`)} className="btn-primary btn-sm mt-3 w-full">Open complaint <ArrowRight className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            )}
          </div>
        </Panel>

        <Panel className="flex max-h-[660px] flex-col">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
            <div className="font-bold">Priority Queue</div>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold text-ink-600">{open.length} open</span>
          </div>
          <div className="scrollbar-thin flex-1 divide-y divide-ink-100 overflow-y-auto">
            {open.slice(0, 40).map((c) => (
              <button key={c.id} onClick={() => nav(`/municipal/complaints/${c.id}`)} onMouseEnter={() => setSel(c)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-ink-50">
                <span className={clsx('h-9 w-1 shrink-0 rounded-full', c.priority === 'critical' ? 'bg-red-600' : c.priority === 'high' ? 'bg-orange-500' : c.priority === 'medium' ? 'bg-yellow-400' : 'bg-ink-300')} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="mono text-sm font-bold">{c.id}</span>
                    {hsSet.has(c.id) && <Siren className="h-3.5 w-3.5 text-red-600" />}
                    {c.escalated && <span className="rounded bg-red-50 px-1 text-[9px] font-bold text-red-600">ESC</span>}
                  </div>
                  <div className="truncate text-xs text-ink-500">W{c.wardNo} · {c.locationName}</div>
                </div>
                <div className="text-right">
                  <PriorityBadge priority={c.priority} />
                  <div className="mt-1 text-[10px] text-ink-400">{timeAgo(c.createdAt)}</div>
                </div>
              </button>
            ))}
          </div>
          <Link to="/municipal/complaints" className="border-t border-ink-100 px-4 py-2.5 text-center text-xs font-bold text-brand-700 hover:bg-ink-50">View all complaints →</Link>
        </Panel>
      </div>

      <div className="mt-6 mb-3 flex items-center gap-2">
        <h2 className="text-lg font-bold">Ward-wise Analytics</h2>
        <DemoTag />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {wardData.map((w) => (
          <Link key={w.zone} to="/municipal/wards" className="rounded-2xl border border-ink-200/60 bg-white p-4 shadow-card transition hover:shadow-lift">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 font-bold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: ZONE_COLOR[w.zone] }} />{w.name}</div>
                <div className="text-[11px] text-ink-500">{w.area}</div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl font-extrabold">{w.total}</div>
                <div className="text-[10px] uppercase tracking-wider text-ink-400">total</div>
              </div>
            </div>
            <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="bg-sky-500" style={{ width: `${(w.pending / w.total) * 100}%` }} />
              <div className="ml-0.5 bg-amber-500" style={{ width: `${(w.inProgress / w.total) * 100}%` }} />
              <div className="ml-0.5 bg-emerald-500" style={{ width: `${(w.resolved / w.total) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px]">
              <div><div className="font-bold text-sky-600">{w.pending}</div>pending</div>
              <div><div className="font-bold text-amber-600">{w.inProgress}</div>in prog.</div>
              <div><div className="font-bold text-emerald-600">{w.resolved}</div>resolved</div>
              <div><div className="font-bold text-red-600">{w.hotspots}</div>repeat</div>
            </div>
          </Link>
        ))}
      </div>
      <Panel className="mt-4 p-4">
        <div className="mb-2 text-sm font-bold">Open workload by ward</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wardData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="30%">
              <CartesianGrid stroke="#eceef2" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,.03)' }} contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Pending" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="In Progress" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
