import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Siren, ArrowRight } from 'lucide-react';
import { useStore } from '../../lib/store';
import { zoneById } from '../../lib/geo';
import type { ZoneId } from '../../lib/types';
import { bucketOf, PRIORITY_RANK } from '../../lib/status';
import { fmtWhen } from '../../lib/format';
import { CREWS } from '../../lib/seed';
import { PriorityBadge, ProgressBar, StatusBadge } from '../../components/badges';
import { Segmented, EmptyState } from '../../components/ui';
import { useT } from '../../i18n';
import { PageHead, Panel } from './shared';

type F = 'open' | 'pending' | 'in_progress' | 'awaiting' | 'resolved' | 'all';

export default function Complaints() {
  const t = useT();
  const nav = useNavigate();
  const complaints = useStore((s) => s.complaints);
  const hotspots = useStore((s) => s.hotspots);
  const hs = useMemo(() => new Set(hotspots.flatMap((h) => h.complaintIds)), [hotspots]);
  const [f, setF] = useState<F>('open');
  const [zone, setZone] = useState('all');
  const [prio, setPrio] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'newest' | 'priority'>('newest');
  const [limit, setLimit] = useState(40);

  const match = (c: (typeof complaints)[number]) =>
    f === 'all' ||
    (f === 'open' && c.status !== 'verified_resolved') ||
    (f === 'pending' && bucketOf(c.status) === 'pending') ||
    (f === 'in_progress' && c.status === 'in_progress') ||
    (f === 'awaiting' && (c.status === 'awaiting_verification' || c.status === 'cleanup_completed')) ||
    (f === 'resolved' && c.status === 'verified_resolved');

  const list = useMemo(() => {
    const qq = q.toLowerCase().trim();
    const l = complaints.filter(
      (c) => match(c) && (zone === 'all' || c.zone === zone) && (prio === 'all' || c.priority === prio) && (!qq || c.id.toLowerCase().includes(qq) || c.locationName.toLowerCase().includes(qq) || c.citizenId.toLowerCase().includes(qq) || String(c.wardNo) === qq),
    );
    return sort === 'priority' ? [...l].sort((a, b) => PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] || b.createdAt - a.createdAt) : l;
  }, [complaints, f, zone, prio, q, sort]); // eslint-disable-line

  const cnt = (x: F) => complaints.filter((c) => {
    return x === 'all' || (x === 'open' && c.status !== 'verified_resolved') || (x === 'pending' && bucketOf(c.status) === 'pending') || (x === 'in_progress' && c.status === 'in_progress') || (x === 'awaiting' && (c.status === 'awaiting_verification' || c.status === 'cleanup_completed')) || (x === 'resolved' && c.status === 'verified_resolved');
  }).length;

  return (
    <div>
      <PageHead title="Complaint Management" sub="All geo-verified complaints across Sangli, Miraj & Kupwad. Citizens appear only by Citizen ID." />
      <Panel>
        <div className="flex flex-col gap-3 border-b border-ink-100 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="scrollbar-thin overflow-x-auto">
            <Segmented<F>
              value={f}
              onChange={(v) => { setF(v); setLimit(40); }}
              className="!flex-nowrap"
              options={[
                { value: 'open', label: 'Open', count: cnt('open') },
                { value: 'pending', label: 'Pending / Assigned', count: cnt('pending') },
                { value: 'in_progress', label: 'In Progress', count: cnt('in_progress') },
                { value: 'awaiting', label: 'Awaiting Verification', count: cnt('awaiting') },
                { value: 'resolved', label: 'Verified Resolved', count: cnt('resolved') },
                { value: 'all', label: 'All', count: complaints.length },
              ]}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input className="input !py-2 pl-9" placeholder="ID, location, Citizen ID, ward no." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input !w-auto !py-2" value={zone} onChange={(e) => setZone(e.target.value)}>
              <option value="all">All zones</option>
              {['A', 'B', 'C', 'D'].map((z) => <option key={z} value={z}>Zone {z} · {zoneById(z as ZoneId).area}</option>)}
            </select>
            <select className="input !w-auto !py-2" value={prio} onChange={(e) => setPrio(e.target.value)}>
              <option value="all">All priorities</option>
              {['critical', 'high', 'medium', 'low'].map((p) => <option key={p} value={p}>{t(`priority.${p}`)}</option>)}
            </select>
            <select className="input !w-auto !py-2" value={sort} onChange={(e) => setSort(e.target.value as 'newest')}>
              <option value="newest">Newest first</option>
              <option value="priority">Highest priority</option>
            </select>
          </div>
        </div>
        {list.length === 0 ? (
          <div className="p-6"><EmptyState icon={<Search className="h-5 w-5" />} title="No complaints match these filters." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-[11px] uppercase tracking-wider text-ink-400">
                  <th className="px-4 py-2.5 font-semibold">Complaint</th>
                  <th className="px-3 py-2.5 font-semibold">Citizen ID</th>
                  <th className="px-3 py-2.5 font-semibold">Ward / Location</th>
                  <th className="px-3 py-2.5 font-semibold">Reported</th>
                  <th className="px-3 py-2.5 font-semibold">Priority</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <th className="px-3 py-2.5 font-semibold">Team</th>
                  <th className="px-3 py-2.5 font-semibold w-36">Progress</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.slice(0, limit).map((c) => (
                  <tr key={c.id} onClick={() => nav(`/municipal/complaints/${c.id}`)} className="group cursor-pointer border-b border-ink-50 hover:bg-brand-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="mono font-bold">{c.id}</span>
                        {hs.has(c.id) && <Siren className="h-3.5 w-3.5 text-red-600" />}
                        {c.escalated && <span className="rounded bg-red-50 px-1 text-[9px] font-bold text-red-600">ESCALATED</span>}
                        {!c.demo && <span className="rounded bg-brand-50 px-1 text-[9px] font-bold text-brand-700">NEW</span>}
                      </div>
                      <div className="text-xs text-ink-500">{t(`type.${c.type}`)}</div>
                    </td>
                    <td className="mono px-3 py-3 text-xs font-semibold text-ink-700">{c.citizenId}</td>
                    <td className="px-3 py-3"><div className="font-semibold">Ward {c.wardNo}</div><div className="max-w-[180px] truncate text-xs text-ink-500">{c.locationName}</div></td>
                    <td className="px-3 py-3 text-xs text-ink-600">{fmtWhen(c.createdAt)}</td>
                    <td className="px-3 py-3"><PriorityBadge priority={c.priority} /></td>
                    <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-3 text-xs text-ink-600">{CREWS.find((k) => k.id === c.crewId)?.name ?? '—'}</td>
                    <td className="px-3 py-3"><ProgressBar status={c.status} /></td>
                    <td className="px-3 py-3"><ArrowRight className="h-4 w-4 text-ink-300 group-hover:text-brand-600" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {limit < list.length && (
          <div className="border-t border-ink-100 p-3 text-center">
            <button className="btn-secondary btn-sm" onClick={() => setLimit((l) => l + 40)}>Load more ({list.length - limit} remaining)</button>
          </div>
        )}
      </Panel>
    </div>
  );
}
