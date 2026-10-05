import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { useStore } from '../../lib/store';
import { WARDS, ZONES } from '../../lib/geo';
import { ZONE_COLOR } from '../../lib/status';
import { useWardStatuses } from '../../lib/useWardStatus';
import { LEVEL_KEY } from '../../lib/wardStatus';
import { StatusStars, LEVEL_TONE } from '../../components/StatusStars';
import { useT } from '../../i18n';
import clsx from 'clsx';
import { Lock } from 'lucide-react';
import { DemoTag } from '../../components/ui';
import { PageHead, Panel, zoneStats } from './shared';

export default function WardAnalytics() {
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const t = useT();
  const statuses = useWardStatuses();
  const zones = ZONES.map((z) => {
    const st = zoneStats(complaints, z.id, hotspots.filter((h) => h.zone === z.id).length);
    const res = complaints.filter((c) => c.zone === z.id && c.verification);
    const avg = res.reduce((s, c) => s + (c.verification!.at - c.createdAt), 0) / Math.max(1, res.length) / 3600000;
    return { ...st, zone: z.id, name: z.name, area: z.area, avg: Math.round(avg * 10) / 10, levels: statuses.filter((s) => s.zone === z.id).map((s) => s.level), Pending: st.pending, 'In Progress': st.inProgress, Resolved: st.resolved };
  });
  const wards = WARDS.map((w) => {
    const cs = complaints.filter((c) => c.wardNo === w.no);
    return { no: w.no, zone: w.zone, name: w.name, total: cs.length, open: cs.filter((c) => c.status !== 'verified_resolved').length, critical: cs.filter((c) => c.status !== 'verified_resolved' && (c.priority === 'critical' || c.priority === 'high')).length, hs: hotspots.filter((h) => h.wardNo === w.no).length };
  });

  return (
    <div>
      <PageHead title="Ward-wise Analytics" sub="Complaint volume, resolution and repeat-hotspot load by zone and ward." right={<DemoTag />} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {zones.map((z) => (
          <Panel key={z.zone} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-display text-lg font-bold"><span className="h-3 w-3 rounded-full" style={{ background: ZONE_COLOR[z.zone] }} />{z.name}</div>
              <span className="flex gap-1 text-[10px] font-bold">
                {([5, 4, 3] as const).map((l) => {
                  const n = z.levels.filter((x) => x === l).length;
                  return n ? <span key={l} className={clsx('rounded-md px-1.5 py-0.5 ring-1 ring-inset', LEVEL_TONE[l].bg, LEVEL_TONE[l].text, LEVEL_TONE[l].ring)}>{n} {l}★</span> : null;
                })}
              </span>
            </div>
            <div className="text-xs text-ink-500">{z.area}</div>
            <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10.5px] text-ink-500">
              <div><div className="font-display text-lg font-extrabold text-ink-900">{z.total}</div>total</div>
              <div><div className="font-display text-lg font-extrabold text-sky-600">{z.pending}</div>pending</div>
              <div><div className="font-display text-lg font-extrabold text-amber-600">{z.inProgress}</div>in prog.</div>
              <div><div className="font-display text-lg font-extrabold text-emerald-600">{z.resolved}</div>resolved</div>
              <div><div className="font-display text-lg font-extrabold text-red-600">{z.hotspots}</div>repeat</div>
            </div>
            <div className="mt-3 text-xs text-ink-500">Avg. verified resolution: <b className="text-ink-800">{z.avg} h</b></div>
          </Panel>
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Panel className="p-4">
          <div className="mb-2 text-sm font-bold">Complaint status by zone</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid stroke="#eceef2" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,.03)' }} contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Resolved" stackId="a" fill="#16a34a" />
                <Bar dataKey="In Progress" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Pending" stackId="a" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel className="p-4">
          <div className="mb-2 text-sm font-bold">Average verified resolution time (hours)</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zones} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
                <CartesianGrid stroke="#eceef2" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#66738c' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,.03)' }} contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12 }} />
                <Bar dataKey="avg" name="Avg hours" fill="#1b7e68" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 11, fill: '#424b5e' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>
      <Panel className="mt-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 px-4 py-3">
          <div>
            <div className="font-bold">Ward Cleanliness Status — underlying indicators</div>
            <div className="text-xs text-ink-500">Internal view. The public Ward Status page shows only the star status and plain-language highlights, listed by ward number.</div>
          </div>
          <span className="flex items-center gap-1 rounded-lg bg-ink-100 px-2 py-1 text-[11px] font-bold text-ink-600"><Lock className="h-3 w-3" /> Staff only</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-400">
                <th className="px-4 py-2.5 font-semibold">Ward</th>
                <th className="px-3 py-2.5 font-semibold">Public status</th>
                <th className="px-3 py-2.5 text-right font-semibold">Reports</th>
                <th className="px-3 py-2.5 text-right font-semibold">Open</th>
                <th className="px-3 py-2.5 text-right font-semibold">Verified resolution</th>
                <th className="px-3 py-2.5 text-right font-semibold">Avg. cleanup</th>
                <th className="px-3 py-2.5 text-right font-semibold">Hotspots (active / managed)</th>
                <th className="px-3 py-2.5 text-right font-semibold">Verification pass</th>
                <th className="px-3 py-2.5 text-right font-semibold">Feedback</th>
                <th className="px-4 py-2.5 text-right font-semibold">High/Critical open</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((s) => {
                const i = s.indicators;
                const w = wards.find((x) => x.no === s.wardNo)!;
                return (
                  <tr key={s.wardNo} className="border-b border-ink-50">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 font-bold"><span className="h-2 w-2 rounded-full" style={{ background: ZONE_COLOR[s.zone] }} />Ward {s.wardNo}</div>
                      <div className="text-xs text-ink-500">{s.name} · Zone {s.zone}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusStars level={s.level} size="h-3.5 w-3.5" />
                      <div className={clsx('text-[11px] font-semibold', LEVEL_TONE[s.level].text)}>{t(`ws.${LEVEL_KEY[s.level]}`)}</div>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{i.total}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{i.open}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{Math.round(i.resolutionRate * 100)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{i.avgCleanupHours === null ? '—' : `${i.avgCleanupHours.toFixed(1)} h`}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      <span className={i.activeHotspots ? 'font-bold text-red-600' : ''}>{i.activeHotspots}</span> / {i.managedHotspots}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{Math.round(i.verificationPassRate * 100)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{i.feedbackAvg === null ? '—' : `${i.feedbackAvg.toFixed(1)} / 5`}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{w.critical > 0 ? <span className="font-bold text-orange-600">{w.critical}</span> : 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-ink-100 px-4 py-3 text-[11px] text-ink-500">
          Status levels: ★★★★★ Excellent · ★★★★ Good · ★★★ Improving. Derived from verified resolution rate, cleanup timeliness, repeat-hotspot status, ground-verification pass rate and citizen feedback (demo data).
        </div>
      </Panel>
    </div>
  );
}
